// Import necessary modules and dependencies
import mongoose from "mongoose";
import type { HydratedDocument, Model, Types } from "mongoose";
import { Post, type PostType } from "../post/post.model";

// Thread Related Types
export interface IThread {
	topic: Types.ObjectId;
	originalPost: Types.ObjectId;
	originalPoster?: Types.ObjectId;
	pinned?: boolean;
	locked?: boolean;
	expiresAt?: Date;
	pageNumber?: number;
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
		originalPost: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
		originalPoster: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		pinned: {
			type: Boolean,
			default: false,
			required: true,
		},
		locked: {
			type: Boolean,
			default: false,
			required: true,
		},
		expiresAt: {
			type: Date,
			required: false,
		},
		pageNumber: {
			type: Number,
			default: 1,
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

ThreadSchema.pre(
	"deleteOne",
	{ document: true, query: false },
	async function preRemove(this: ThreadType, next: () => void) {
		// Delete all posts associated with this thread in a single operation
		await Post.deleteMany({ thread: this._id });
		next();
	},
);

// Export model
export const Thread = mongoose.model<IThread, ThreadModel>(
	"Thread",
	ThreadSchema,
);
