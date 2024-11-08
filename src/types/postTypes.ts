import type { HydratedDocument, Model, Types } from "mongoose";

// Post Related Types
export interface IPost {
	title: string;
	content: string;
	topic: Types.ObjectId;
	thread: Types.ObjectId;
	user: Types.ObjectId;
	mentionedParents: Types.ObjectId[];
	media: string[];
	mediaType: string | null;
	edited: boolean;
}

export interface IPostVirtuals {
	mentioningChildren: Types.ObjectId[];
}

export interface IPostMethods {
	generateToken(): string;
	toCustomJSON(): HydratedDocument<IPost, IPostMethods & IPostVirtuals>;
	verifyPassword(currentPassword: string): null;
}

export type PostModel = Model<IPost, object, IPostMethods & IPostVirtuals>;

export type PostType = HydratedDocument<IPost, IPostMethods & IPostVirtuals>;
