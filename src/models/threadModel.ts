import mongoose from 'mongoose';
import { PostType, ThreadType, UserType } from 'src/types';

export interface IThread {
  topic: mongoose.Types.ObjectId;
  openingPoster: UserType;
  posts: PostType[];
}

export interface IThreadVirtuals {
  posts: mongoose.Types.ObjectId[];
}

export type ThreadModel = mongoose.Model<IThread, object, IThreadVirtuals>;

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

const ThreadSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    openingPoster: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      trim: true,
    },
    posts: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentionedParents: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Thread',
        },
      ],
    },
    media: [String],
    mediaType: {
      default: null,
      type: String,
    },
  },
  schemaOptions,
);

ThreadSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function preRemove(this: ThreadType, next: () => void) {
    console.log(this);

    next();
  },
);
// Export model
export const Thread = mongoose.model<IThread, ThreadModel>(
  'Thread',
  ThreadSchema,
);
