import type { Response } from "express";
import type { Request } from "src/commom/generalTypes";
import { wrap } from "src/utils/generalUtils";
import { createPostTemplate } from "../post/post.controllers";
import { Thread } from "./thread.model";
import type { ThreadType } from "./thread.types";

export const createThread = wrap(async (req: Request, res: Response) => {
	// Create a new Post instance with the request body and user ID
	const thread = new Thread({ ...req.body }) as ThreadType;
	req.body.thread = thread;
	const post = await createPostTemplate(req, res);
	req.body.thread.originalPost = post._id;
	req.body.thread.originalPoster = req.user?._id;
	await thread.save();
	// Save the post and return the full post data
	const fullPost = await post.toCustomJSON();
	return res.status(200).send(fullPost);
});

export const getThread = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(
		await req.thread?.populate({
			path: "posts",
			options: { sort: { createdAt: -1 } },
		}),
	);
});

export const deleteThread = wrap(async (req: Request, res: Response) => {
	await req.thread?.deleteOne();
	return res.status(200).send();
});
