import type {
	HydratedDocument,
	Model,
	Date as MongooseDate,
	Types,
} from "mongoose";

export interface IThread {
	topic: Types.ObjectId;
	originalPost: Types.ObjectId;
	originalPoster?: Types.ObjectId;
	pinned?: boolean;
	locked?: boolean;
	expiresAt?: MongooseDate;
	pageNumber?: number;
}

export interface IThreadVirtuals {
	posts: Types.ObjectId[];
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
