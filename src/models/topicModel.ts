import fs from "node:fs";
import path from "node:path";
import type {
	ITopic,
	ITopicMethods,
	ITopicVirtuals,
	TopicModel,
	TopicType,
} from "@/types"; // Custom types
// Import necessary modules and dependencies
import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator"; // Plugin for unique field validation
import { Thread } from "./threadModel";

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
