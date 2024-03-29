/* eslint-disable @typescript-eslint/no-empty-function */
import mongoose from 'mongoose';
import fs from 'fs';

const schemaOptions: object = {
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
  timestamps: true,
  id: false,
};

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 254,
      trim: true,
      es_indexed: true,
    },
    content: {
      type: String,
      required: false,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentionedParents: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
      ],
    },
    media: [String],
    mediaType: {
      default: null,
      type: String,
    },
    edited: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  schemaOptions,
);

PostSchema.index({ title: 'text' });

PostSchema.virtual('mentioningChildren', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'mentionedParents',
});

PostSchema.method('toCustomJSON', async function toCustomJSON() {
  await this.populate('mentioningChildren');
  const postObject = await this.toObject({ virtuals: true });
  return postObject;
});

PostSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function preRemove(this: IPostDocument, next: () => void) {
    console.log(this);
    if (this.mediaType) {
      this.media.forEach(async (element) => {
        const filePath = `.\\media\\${this.mediaType}\\${element}`;
        if (fs.existsSync(filePath)) fs.rm(filePath, () => {});
      });
    }

    await this.populate('mentioningChildren');
    for (const childId of this.mentioningChildren) {
      const formerChild = await Post.findById(childId);
      if (formerChild) {
        formerChild.mentionedParents.splice(
          formerChild.mentionedParents.indexOf(this._id),
          1,
        );
        await formerChild.save();
      }
    }

    next();
  },
);

export interface IPost extends mongoose.Document {
  title: string;
  content: string;
  user: mongoose.Types.ObjectId;
  mentionedParents: mongoose.Types.ObjectId[];
  media: string[];
  mediaType: string;
  edited: boolean;
  mentioningChildren?: mongoose.Types.ObjectId[];
}

export interface IPostDocument extends IPost {
  toCustomJSON(): typeof Post;
  preRemove(next: () => void): void;
}

export type IPostModel = mongoose.Model<IPostDocument>;

// Export model
export const Post: IPostModel = mongoose.model<IPostDocument, IPostModel>(
  'Post',
  PostSchema,
);
