import type { HydratedDocument, Model, Types } from "mongoose";
import type { PostType } from ".";

// Thread Related Types
export interface IThread {
	topic: Types.ObjectId;
}

export interface IThreadVirtuals {
	posts: PostType[]; // Array of user's posts
}

export interface IThreadMethods {
	toCustomJSON(): HydratedDocument<IThread, IThreadMethods & IThreadVirtuals>;
}

export type ThreadModel = Model<
	IThread,
	object,
	IThreadMethods & IThreadVirtuals
>;

export type ThreadType = HydratedDocument<
	IThread,
	IThreadMethods & IThreadVirtuals
>;
