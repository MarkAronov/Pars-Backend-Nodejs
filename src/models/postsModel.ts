import mongoose from 'mongoose';

const schemaOptions: any = {
  toJSON: {
    virtuals: true,
  },
  toObject: {
    vituals: true,
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
    },
    content: {
      type: String,
      required: true,
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
    media: {
      type: [
        {
          type: Buffer,
        },
      ],
    },
    edited: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  schemaOptions
);

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
  mentionedParents: Array<mongoose.Types.ObjectId>;
  media: Array<{
    type?: Buffer;
  }>;
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

// Export model
