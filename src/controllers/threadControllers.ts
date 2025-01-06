import { Thread } from "@/models";
import type { Request, ThreadType } from "@/types";
import { wrap } from "@/utils";
import type { Response } from "express";
import mongoose from "mongoose";
import { createPostTemplate } from "./postControllers";

export const createThread = wrap(async (req: Request, res: Response) => {
	// Create a new Post instance with the request body and user ID
	const thread = new Thread({ ...req.body }) as ThreadType;
	req.body.thread = thread._id;

	const post = await createPostTemplate(req, res);
	await thread.save();
	// Save the post and return the full post data
	const fullPost = await post.toCustomJSON();
	return res.status(200).send(fullPost);
});

export const getThread = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(req.body);
});

export const deleteThread = wrap(async (req: Request, res: Response) => {
	return res.status(200).send(req.body);
});
