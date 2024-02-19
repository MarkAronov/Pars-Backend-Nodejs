import mongoose from 'mongoose';
import fs from 'fs';

const schemaOptions: any = {
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
    mainPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
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
  schemaOptions
);

PostSchema.index({ title: 'text' });

PostSchema.virtual('mainPostChildren', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'mainPost',
});

PostSchema.virtual('mentioningChildren', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'mentionedParents',
});

PostSchema.method('toCustomJSON', async function toCustomJSON() {
  const post = this;
  await post.populate('mainPostChildren');
  await post.populate('mentioningChildren');
  const postObject = await post.toObject({ virtuals: true });
  delete postObject.__v;
  return postObject;
});

PostSchema.pre('remove', async function preRemove(next: () => void) {
  const post: any = this;

  if (post.mediaType) {
    post.media.forEach(async (element) => {
      const filePath = `.\\media\\${post.mediaType}\\${element}`;
      if (fs.existsSync(filePath)) fs.rm(filePath, () => {});
    });
  }

  if (post.mainPost === null) {
    await post.populate('mainPostChildren');
    for (const childId of post.mainPostChildren) {
      const childPost = await Post.findById(childId);
      if (childPost) {
        childPost.remove();
      }
    }
  } else {
    await post.populate('mentioningChildren');
    for (const childId of post.mentioningChildren) {
      const formerChild = await Post.findById(childId);
      if (formerChild) {
        formerChild.mentionedParents.splice(
          formerChild.mentionedParents.indexOf(post._id),
          1
        );
        await formerChild.save();
      }
    }
  }
  next();
});

export interface IPost extends mongoose.Document {
  title: string;
  content: string;
  user: mongoose.Types.ObjectId;
  mainPost: mongoose.Types.ObjectId;
  mentionedParents: mongoose.Types.ObjectId[];
  media: string[];
  mediaType: String;
  edited: boolean;
}

interface IPostDocument extends IPost {
  toCustomJSON(): typeof Post;
  preRemove(next: () => void): void;
}

export interface IPostModel extends mongoose.Model<IPostDocument> {}

// Export model
export const Post: IPostModel = mongoose.model<IPostDocument, IPostModel>(
  'Post',
  PostSchema
);
