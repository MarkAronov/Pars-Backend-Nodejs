import fs from "node:fs";
import path from "node:path";
// Import necessary modules and dependencies
import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator"; // Plugin for unique field validation
import { TOPIC_RULES } from "./topic.constants";
import { validateTopicName, validateTopicDescription, validateTopicMedia } from "./topic.validators";
import type { ITopic, TopicModel, ITopicMethods, ITopicVirtuals, TopicType } from "./topic.types";
import { Thread} from "../thread/thread.model";


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
			minLength: [TOPIC_RULES.MIN_NAME_LENGTH, `Name must be at least ${TOPIC_RULES.MIN_NAME_LENGTH} characters`],
			maxLength: [TOPIC_RULES.MAX_NAME_LENGTH, `Name cannot be longer than ${TOPIC_RULES.MAX_NAME_LENGTH} characters`],
			validate: validateTopicName
		},
		description: {
			type: String,
			required: false,
			trim: true,
			maxLength: [TOPIC_RULES.MAX_DESCRIPTION_LENGTH, `Description cannot be longer than ${TOPIC_RULES.MAX_DESCRIPTION_LENGTH} characters`],
			validate: validateTopicDescription
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
