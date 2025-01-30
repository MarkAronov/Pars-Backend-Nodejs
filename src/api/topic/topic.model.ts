import fs from "node:fs";
import path from "node:path";
// Import necessary modules and dependencies
import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator"; // Plugin for unique field validation

import type { HydratedDocument, Model } from "mongoose";
import type { PostType } from "../post/post.model";
import { Thread, type ThreadType } from "../thread/thread.model";

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

// Define the schema for the Topic model
const TopicSchema = new mongoose.Schema<
	ITopic,
	TopicModel,
	ITopicMethods,
	Record<string, never>,
	ITopicVirtuals
>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		description: {
			type: String,
			required: false,
			trim: true,
		},
		cover: {
			type: String,
			default: null,
		},
	},
	schemaOptions,
);

TopicSchema.virtual("threads", {
	ref: "Thread",
	localField: "_id",
	foreignField: "topic",
});

TopicSchema.virtual("posts", {
	ref: "Post",
	localField: "_id",
	foreignField: "topic",
});

TopicSchema.pre(
	"deleteOne",
	{ document: true, query: false },
	async function preRemove(this: TopicType, next: () => void) {
		await this.populate("threads");
		for (const threadID of this.threads) {
			const thread = await Thread.findById(threadID);
			await thread?.deleteOne();
		}
		const fileFolderPath = path.join(process.cwd(), "/media/");
		if (this.cover)
			await fs.promises.rm(`${fileFolderPath}/cover/${this.cover}`);

		next();
	},
);

TopicSchema.plugin(uniqueValidator, { message: "dupe" });

// Export model
export const Topic = mongoose.model<ITopic, TopicModel>("Topic", TopicSchema);
