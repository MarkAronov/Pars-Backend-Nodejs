import fs from "node:fs";
// Import necessary modules and dependencies
import mongoose from "mongoose";
import type {
	IPost,
	IPostMethods,
	IPostVirtuals,
	PostModel,
	PostType,
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

// Define the schema for the Post model
const PostSchema = new mongoose.Schema<
	IPost,
	PostModel,
	IPostMethods,
	Record<string, never>,
	IPostVirtuals
>(
	{
		title: {
			type: String,
			required: true,
			maxLength: 254,
			trim: true,
		},
		content: {
			type: String,
			required: false,
			trim: true,
		},
		topic: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Topic",
			required: true,
		},
		thread: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Thread",
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		mentionedParents: {
			type: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "Post",
				},
			],
		},
		media: [String], // Array of strings representing media file paths
		mediaType: {
			default: null,
			type: String,
		},
		edited: {
			type: Boolean,
			required: true,
			default: false, // Indicates whether the post has been edited
		},
	},
	schemaOptions,
);

// Index the title field for full-text search
PostSchema.index({ title: "text" });

// Virtual property for getting children posts that mention the current post
PostSchema.virtual("mentioningChildren", {
	ref: "Post",
	localField: "_id",
	foreignField: "mentionedParents",
});

// Method to convert the post document to a custom JSON format
PostSchema.method("toCustomJSON", async function toCustomJSON() {
	await this.populate("mentioningChildren");
	const postObject = await this.toObject({ virtuals: true });
	return postObject;
});

// Pre-delete middleware to handle cascading delete and file removal
PostSchema.pre(
	"deleteOne",
	{ document: true, query: false },
	async function preRemove(this: PostType, next: () => void) {
		// Remove associated media files if they exist
		if (this.mediaType) {
			for (const file of this.media) {
				const filePath = `.\\media\\${this.mediaType}\\${file}`;
				if (fs.existsSync(filePath)) fs.rm(filePath, () => {});
			}
		}

		// Remove references to this post from mentioning children
		await this.populate("mentioningChildren");
		for (const childId of this.mentioningChildren) {
			const formerChild = await Post.findById(childId);
			if (formerChild) {
				formerChild.mentionedParents.splice(
					formerChild.mentionedParents.indexOf(this._id),
					1,
				);
				await formerChild.save();
			}
		}

		next();
	},
);

// Export the Post model
export const Post = mongoose.model<IPost, PostModel>("Post", PostSchema);
