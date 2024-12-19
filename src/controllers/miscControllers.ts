import path from "node:path";
import type { Response } from "express";
import { fileTypeFromFile } from "file-type";

import { Post } from "../models/postModel";
import { User } from "../models/userModel";
import type { PostType, Request, UserType } from "../types";
import { wrap } from "../utils";

export const search = wrap(async (req: Request, res: Response) => {
	const results: { users: UserType[]; posts: PostType[] } = {
		users: [],
		posts: [],
	};
	if (req.query?.q) {
		const query = req.query.q.toString();
		console.log(query);

		const userSearchResults = await User.aggregate([
			{
				$search: {
					text: {
						query: query,
						path: ["username", "displayName"],
						fuzzy: {
							maxEdits: 2,
							prefixLength: 3,
						},
					},
				},
			},
			{
				$addFields: {
					score: { $meta: "searchScore" },
				},
			},
			{
				$sort: {
					score: -1,
				},
			},
		]);

		const postSearchResults = await Post.aggregate([
			{
				$search: {
					text: {
						query: query,
						path: ["title"],
						fuzzy: {
							maxEdits: 2,
							prefixLength: 1,
						},
					},
				},
			},
			{
				$addFields: {
					score: { $meta: "searchScore" },
				},
			},
			{
				$sort: {
					score: -1,
				},
			},
		]);

		results.users = userSearchResults;
		results.posts = postSearchResults;

		console.log(results);
	}
	return res.status(200).send(results);
});

export const getMedia = wrap(async (req: Request, res: Response) => {
	const filePath = path.join(
		process.cwd(),
		`..\\..\\media\\${req.params.mediatype}\\${req.params.mediafile}`,
	);
	const meta = await fileTypeFromFile(filePath);
	if (meta?.ext === "mp4") {
		return res.status(200).sendFile(filePath);
	}
	return res.status(200).sendFile(filePath);
});

export const unmatchedRoute = wrap(async (req: Request, res: Response) => {
	return res.status(404).send("Route not found");
});
