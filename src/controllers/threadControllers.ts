import fs from "node:fs";
import path from "node:path";
import { fileTypeFromFile } from "file-type";

import type { Response } from "express";
import { Post, Thread } from "../models";
import type { PostType, Request } from "../types";
import { filterDupes, wrap } from "../utils";

export const createThread = wrap(async (req: Request, res: Response) => {
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
		const mediaFolderPath = path.join(process.cwd(), `..\\..\\media\\${mediaType}`);
		const mediaArray: string[] = [];

		for (const file of mediaFiles) {
			const filename = file.filename;
			const meta = await fileTypeFromFile(file.path);
			await fs.rename(
				`${mediaFolderPath}\\${filename}`,
				`${mediaFolderPath}\\${filename}.${meta?.ext}`,
				() => {},
			);
			mediaArray.push(`${filename}.${meta?.ext}`);
		}

		post.media = mediaArray;
		post.mediaType = mediaType as string;
	}

	// Save the post and return the full post data

	const thread = new Thread({ topic: req?.body?.topic });
	post.thread = thread._id;

	await post.save();
	await thread.save();

	const fullPost = await post.toCustomJSON();
	return res.status(200).send(fullPost);
});

export const getThread = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(req.body);
});
export const deleteThread = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(req.body);
});
