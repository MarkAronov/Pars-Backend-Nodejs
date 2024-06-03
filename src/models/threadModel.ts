import mongoose from 'mongoose';
import { PostType, ThreadType } from 'src/types';

export interface IThread {
  board: mongoose.Types.ObjectId;
  openingPost: mongoose.Types.ObjectId;
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
    title: {
      type: String,
      required: true,
      maxLength: 254,
      trim: true,
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

ThreadSchema.index({ title: 'text' });

ThreadSchema.virtual('mentioningChildren', {
  ref: 'Thread',
  localField: '_id',
  foreignField: 'mentionedParents',
});

ThreadSchema.method('toCustomJSON', async function toCustomJSON() {
  await this.populate('mentioningChildren');
  const threadObject = await this.toObject({ virtuals: true });
  return threadObject;
});

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
