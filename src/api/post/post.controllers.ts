import fs from "node:fs";
import path from "node:path";

import type { Response } from "express";
import type { Request } from "src/commom/generalTypes";
import { filterDupes, wrap } from "src/utils/generalUtils";
import { Thread } from "../thread/thread.model";
import { Post } from "./post.model";
import type { PostType } from "./post.types";

export const createPostTemplate = wrap(async (req: Request, res: Response) => {
	// Create a new Post instance with the request body and user ID
	const post = new Post({ ...req.body, user: req?.user?._id }) as PostType;

	// Handle mentioned parents
	if (req.body.mentionedParents) {
		const mentionedParents = filterDupes(req.body.mentionedParents.slice());
		for (const mentionedParent of mentionedParents) {
			post.mentionedParents = [];
			const parent = await Post.findById(mentionedParent);
			if (parent) post.mentionedParents.push(parent._id);
		}
	}

	// Handle file uploads
	if (req.files && Object.keys(req.files).length) {
		const files = req.files as { [fieldname: string]: Express.Multer.File[] };
		const mediaType = Object.keys(req.files)[0] as string;
		const mediaFiles = files[mediaType] as Express.Multer.File[];
		const mediaArray: string[] = [];

		for (const file of mediaFiles) {
			mediaArray.push(file.filename);
		}

		post.media = mediaArray;
		post.mediaType = mediaType as string;
	}

	// Save the post and return the full post data
	await post.save();
	return post;
});

export const createPost = wrap(async (req: Request, res: Response) => {
	const post = await createPostTemplate(req, res);
	const fullPost = await post.toCustomJSON();

	return res.status(200).send(fullPost);
});

export const getAllPosts = wrap(async (req: Request, res: Response) => {
	// Fetch all posts from the database
	return res.status(200).send(await Post.find({}));
});

export const getOnePost = wrap(async (req: Request, res: Response) => {
	// Fetch the post by ID and return the full post data
	return res.status(201).send(await req.post?.toCustomJSON());
});

export const patchPost = wrap(async (req: Request, res: Response) => {
	// Fetch the post by ID and update its fields
	const post = req.post;
	let fullPost: PostType | null = null;
	if (post) {
		let mediaArray: string[] = post.media;
		const mediaFolderPath = path.join(process.cwd(), "..\\..\\media\\");

		// Handle new file uploads and remove old files if necessary
		if (req.files && Object.keys(req.files).length) {
			if (post.mediaType) {
				const path = `${mediaFolderPath}\\${post.mediaType}\\`;
				for (const postFile of post.media) {
					await fs.rm(`${path}\\${postFile}`, () => {});
				}
			}

			const files = req.files as {
				[fieldname: string]: Express.Multer.File[];
			};
			const mediaType = Object.keys(req.files)[0] as string;
			const mediaFiles = files[mediaType] as Express.Multer.File[];
			mediaArray = [];
			for (const file of mediaFiles) {
				mediaArray.push(file.filename);
			}

			post.media = mediaArray;
			post.mediaType = mediaArray.length ? (mediaType as string) : null;
		}

		// Update the post's title and content
		post.title = req.body.title || post.title;
		post.content = req.body.content || post.content;

		// Update mentioned parents
		if (req.body.mentionedParents) {
			post.mentionedParents = [];
			const mentionedParents = filterDupes(req.body.mentionedParents.slice());
			for (const mentionedParent of mentionedParents) {
				const parent = await Post.findById(mentionedParent);
				if (parent) post.mentionedParents.push(parent._id);
			}
		}

		// Handle files to be removed
		if (req.body.filesToRemove) {
			const filesToRemove = post.mediaType
				? post.media.slice()
				: filterDupes(req.body.filesToRemove.slice());
			for (const fileToRemove of filesToRemove) {
				const filePath = `${mediaFolderPath}\\${post.mediaType}\\${fileToRemove}`;
				if (fs.existsSync(filePath)) {
					await fs.rm(filePath, () => {});
					mediaArray.splice(mediaArray.indexOf(fileToRemove), 1);
				}
			}
		}

		// Mark the post as edited if there are changes
		if (req.body) {
			post.edited = true;
		}
		await post?.save();
		fullPost = await post.toCustomJSON();
	}
	return res.status(200).send(fullPost);
});

// Find the post by ID and delete it
export const deletePost = wrap(async (req: Request, res: Response) => {
	const thread = await Thread.findById(req.post?.thread);
	if (req.post?.thread.toString() === thread?._id.toString()) {
		await thread?.deleteOne();
	} else {
		await req.post?.deleteOne();
	}
	return res.status(200).send();
});
