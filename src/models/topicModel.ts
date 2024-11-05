// Import necessary modules and dependencies
import mongoose from "mongoose";
import type { ITopic, TopicModel, TopicType } from "../types"; // Custom types

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
const TopicSchema = new mongoose.Schema(
	{
		name: {
			type: mongoose.Types.ObjectId,
			required: true,
		},
		description: {
			type: mongoose.Schema.Types.ObjectId,
			required: false,
			trim: true,
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
		console.log(this);

		next();
	},
);

// Export model
export const Topic = mongoose.model<ITopic, TopicModel>("Topic", TopicSchema);
