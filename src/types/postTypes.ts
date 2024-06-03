import mongoose, { HydratedDocument } from 'mongoose';

// Post Related Types
export interface IPost {
  title: string;
  content: string;
  topic: mongoose.Types.ObjectId;
  thread: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  mentionedParents: mongoose.Types.ObjectId[];
  media: string[];
  mediaType: string | null;
  edited: boolean;
}

export interface IPostVirtuals {
  mentioningChildren: mongoose.Types.ObjectId[];
}

export interface IPostMethods {
  generateToken(): string;
  toCustomJSON(): mongoose.HydratedDocument<
    IPost,
    IPostMethods & IPostVirtuals
  >;
  verifyPassword(currentPassword: string): null;
}

export type PostModel = mongoose.Model<
  IPost,
  object,
  IPostMethods & IPostVirtuals
>;

export type PostType = HydratedDocument<IPost, IPostMethods & IPostVirtuals>;
