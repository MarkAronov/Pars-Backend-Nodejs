import type {
	HydratedDocument,
	Model,
	Date as MongooseDate,
	Types,
} from "mongoose";

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
	toCustomJSON(): HydratedDocument<IPost, IPostMethods & IPostVirtuals>;
}

export type PostModel = Model<IPost, object, IPostMethods & IPostVirtuals>;

export type PostType = HydratedDocument<IPost, IPostMethods & IPostVirtuals>;
