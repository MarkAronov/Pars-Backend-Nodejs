import type {
	HydratedDocument,
	Model,
	Date as MongooseDate,
	Types,
} from "mongoose";

export interface ITopic {
	name: string;
	description: string;
	cover: string;
}

export interface ITopicVirtuals {
	threads: Types.ObjectId[];
	posts: Types.ObjectId[];
}

export interface ITopicMethods {
	toCustomJSON(): HydratedDocument<ITopic, ITopicMethods & ITopicVirtuals>;
}

export type TopicModel = Model<ITopic, object, ITopicMethods & ITopicVirtuals>;

export type TopicType = HydratedDocument<
	ITopic,
	ITopicMethods & ITopicVirtuals
>;

export type TopicMediaTypeKey = "cover";
