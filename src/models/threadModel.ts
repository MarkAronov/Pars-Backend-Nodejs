// Import necessary modules and dependencies
import mongoose from "mongoose";
import type {
	IThread,
	IThreadMethods,
	IThreadVirtuals,
	ThreadModel,
	ThreadType,
} from "../types"; // Custom types

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

// Define the schema for the Thread model
const ThreadSchema = new mongoose.Schema<
	IThread,
	ThreadModel,
	IThreadMethods,
	Record<string, never>,
	IThreadVirtuals
>(
	{
		topic: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Topic",
			required: true,
		},
	},
	schemaOptions,
);

ThreadSchema.virtual("posts", {
	ref: "Post",
	localField: "_id",
	foreignField: "thread",
});

ThreadSchema.method("toCustomJSON", async function toCustomJSON() {
	await this.populate("mentioningChildren");
	const postObject = await this.toObject({ virtuals: true });
	return postObject;
});

ThreadSchema.pre(
	"deleteOne",
	{ document: true, query: false },
	async function preRemove(this: ThreadType, next: () => void) {
		console.log(this);

		next();
	},
);

// Export model
export const Thread = mongoose.model<IThread, ThreadModel>(
	"Thread",
	ThreadSchema,
);
