import type { HydratedDocument, Model } from "mongoose";
import type { PostType, ThreadType } from ".";

// Topic Related Types
export interface ITopic {
	name: string;
	description: string;
	cover: string;
}

export interface ITopicVirtuals {
	threads: ThreadType[];
	posts: PostType[];
}

export interface ITopicMethods {
	toCustomJSON(): HydratedDocument<ITopic, ITopicMethods & ITopicVirtuals>;
}
export type TopicMediaTypeKey = "cover";

export type TopicModel = Model<ITopic, object, ITopicMethods & ITopicVirtuals>;

export type TopicType = HydratedDocument<
	ITopic,
	ITopicMethods & ITopicVirtuals
>;
