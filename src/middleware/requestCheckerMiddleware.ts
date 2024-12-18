import bcrypt from "bcryptjs";
import type { NextFunction, Response } from "express";
import _ from "lodash";
import type mongoose from "mongoose";
import { Post } from "../models/postModel";
import { Thread } from "../models/threadModel";
import { Topic } from "../models/topicModel";
import { User } from "../models/userModel";
import type {
	AllowedMediaTypesKeys,
	PostType,
	Request,
	ThreadType,
	TopicType,
	UserType,
} from "../types";
import {
	ErrorAO,
	allowedFileTypes,
	allowedMediaTypes,
	filterDupes,
	requestMap,
	requestedUserDELETEFields,
	requestedUserGETFields,
	wrap,
} from "../utils";
import { fileTypeFromFile } from "file-type";

/**
 * Middleware to check the parameters and files in the request.
 * Ensures that the required parameters are present, unwanted parameters are not included,
 * the parameters are valid, and the files are of allowed types.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const requestCheckerMiddleware = wrap(
	async (req: Request, _res: Response, next: NextFunction) => {
		const reqKeys = [
			...(req.body ? Object.keys(req.body) : []),
			...(req.files ? Object.keys(req.files) : []),
		];
		const reqMethod: string | undefined = req.method;
		const routePath: string | undefined = req.route?.path;

		// Validate request method and route path
		if (!reqMethod || !routePath) {
			throw new ErrorAO({ MAIN: ["Malformed request"] }, "RequestError", 500);
		}

		const methodRoutes = requestMap[reqMethod];
		if (!methodRoutes) {
			throw new ErrorAO(
				{ MAIN: ["Unsupported request method"] },
				"RequestError",
				400,
			);
		}

		const { requiredParams, optionalParams } = methodRoutes[routePath];
		const parameterFreeRequest =
			(!requiredParams.length && !optionalParams.length) || reqMethod === "GET";

		const isPostRequest = routePath.indexOf("/post") >= 0;
		const isUserRequest = routePath.indexOf("/user") >= 0;
		const isThreadRequest = routePath.indexOf("/thread") >= 0;
		const isTopicRequest = routePath.indexOf("/topic") >= 0;

		let dupeFlag = false;
		const errorArray: { [key: string]: string[] } = {};

		const currentUser = req.user;
		let user: UserType | null = null;
		let post: PostType | null = null;
		let thread: ThreadType | null = null;
		let topic: TopicType | null = null;

		// Validate user for user-related requests
		if (isUserRequest) {
			try {
				user = await User.findOne({ username: req.params.username });
			} catch (err) {
				throw new ErrorAO(
					{ MAIN: ["Malformed username search query"] },
					"ParameterError",
					500,
				);
			}
		}

		// Validate post for post-related requests
		if (isPostRequest) {
			try {
				post = await Post.findById(req.params.id);
			} catch (err) {
				throw new ErrorAO(
					{ MAIN: ["Malformed post id search query"] },
					"ParameterError",
					500,
				);
			}
		}

		// Validate thread for thread-related requests
		if (isThreadRequest) {
			try {
				thread = await Thread.findById(req.params.id);
			} catch (err) {
				throw new ErrorAO(
					{ MAIN: ["Malformed thead id search query"] },
					"ParameterError",
					500,
				);
			}
		}

		// Validate topic for topic-related requests
		if (isTopicRequest) {
			try {
				topic = await Topic.findOne({ name: req.params.name });
			} catch (err) {
				throw new ErrorAO(
					{ MAIN: ["Malformed topic search query"] },
					"ParameterError",
					500,
				);
			}
		}

		// Check permissions for user-related requests
		if (isUserRequest && req.params.username) {
			if (!user) {
				throw new ErrorAO(
					{
						MAIN: [`There's no user with the username: ${req.params.username}`],
					},
					"ParameterError",
					404,
				);
			}
			if (
				currentUser &&
				!(user._id as mongoose.Types.ObjectId).equals(
					currentUser._id as mongoose.Types.ObjectId,
				) &&
				reqMethod !== "GET"
			) {
				throw new ErrorAO(
					{
						MAIN: ["You are not allowed to change/delete this user"],
					},
					"ParameterError",
					403,
				);
			}
		}

		// Check permissions for post-related requests
		if (isPostRequest && req.params.id) {
			if (!post) {
				throw new ErrorAO(
					{
						MAIN: [`No post by that ID: ${req.params.id}`],
					},
					"ParameterError",
					404,
				);
			}
			if (
				currentUser &&
				!(post.user._id as mongoose.Types.ObjectId).equals(
					currentUser._id as mongoose.Types.ObjectId,
				) &&
				reqMethod !== "GET"
			) {
				throw new ErrorAO(
					{
						MAIN: ["You are not allowed to change/delete this post"],
					},
					"ParameterError",
					403,
				);
			}
		}

		// Check permissions for post-related requests
		if (isThreadRequest && req.params.id) {
			if (!thread) {
				throw new ErrorAO(
					{
						MAIN: [`No thread by that ID: ${req.params.id}`],
					},
					"ParameterError",
					404,
				);
			}
			if (
				currentUser &&
				!(thread.posts[0].user._id as mongoose.Types.ObjectId).equals(
					currentUser._id as mongoose.Types.ObjectId,
				) &&
				reqMethod !== "GET"
			) {
				throw new ErrorAO(
					{
						MAIN: ["You are not allowed to change/delete this thread"],
					},
					"ParameterError",
					403,
				);
			}
		}

		// Check permissions for post-related requests
		if (isTopicRequest && req.params.name) {
			if (!topic) {
				throw new ErrorAO(
					{
						MAIN: [`No topic by with that name: ${req.params.name}`],
					},
					"ParameterError",
					404,
				);
			}
			if (reqMethod !== "GET") {
				throw new ErrorAO(
					{
						MAIN: ["You are not allowed to change/delete this topic"],
					},
					"ParameterError",
					403,
				);
			}
		}

		// Check for unwanted parameters
		if (
			!reqKeys.every(
				(key) => requiredParams.includes(key) || optionalParams.includes(key),
			) ||
			(reqMethod === "GET" &&
				req.body.requestedFields &&
				!req.body.requestedFields.every((key: string) =>
					requestedUserGETFields.includes(key),
				)) ||
			(reqMethod === "DELETE" &&
				req.body.requestedFields &&
				!req.body.requestedFields.every((key: string) =>
					requestedUserDELETEFields.includes(key),
				))
		) {
			throw new ErrorAO(
				{
					MAIN: ["Invalid request, got invalid parameters"],
				},
				"ParameterError",
			);
		}

		// Check for missing parameters
		if (!reqKeys.length && !parameterFreeRequest) {
			throw new ErrorAO(
				{
					MAIN: [
						`Missing all required parameters${
							requiredParams.length ? ` (${requiredParams.join(", ")})` : ""
						}.`,
					],
				},
				"ParameterError",
			);
		}

		if (
			optionalParams.length &&
			optionalParams.every((key) => !reqKeys.includes(key)) &&
			reqMethod === "PATCH"
		) {
			errorArray.MAIN = [
				`Missing one of the following optional parameters: ${optionalParams.join(
					", ",
				)}`,
			];
		}

		for (const reqParam of requiredParams) {
			if (!reqKeys.includes(reqParam)) {
				errorArray[reqParam] = [`${reqParam} is missing and it's needed`];
			}
		}

		// Check for duplicate files in the request
		if (
			req.files !== undefined &&
			isPostRequest &&
			((Object.keys(req.files).length > 1) as boolean)
		) {
			dupeFlag = true;
			errorArray.media = [
				"Either upload a set of images, a set of files or a single video",
			];
		}

		// Validate patch requests
		if (reqMethod === "PATCH") {
			for (const reqKey of reqKeys) {
				const errorKey: string = (reqKey.charAt(0).toUpperCase() +
					reqKey.slice(1)) as string;

				if (
					reqKey === "filesToRemove" &&
					isPostRequest &&
					req.files !== undefined &&
					Object.keys(req.files).length
				) {
					const filesToRemove = filterDupes(req.body.filesToRemove.slice());
					const mediaType = Object.keys(req.files)[0];

					if (
						!dupeFlag &&
						!post?.media.every((file) => filesToRemove.includes(file)) &&
						mediaType !== post?.mediaType
					) {
						const errMsg =
							"You can't have multiple media types in the same post";
						errorArray.media = errorArray.media
							? errorArray.media.concat([errMsg])
							: [errMsg];
					}
				}

				if (currentUser !== undefined && reqKey === "newPassword") {
					const formerPasses = currentUser.formerPasswords;
					if (formerPasses) {
						for (const formerPass of formerPasses as string[]) {
							if (await bcrypt.compare(req.body[reqKey], formerPass)) {
								errorArray.password = [
									"This password was previously used, use another.",
								];
							}
						}
					}
				}

				if (
					(currentUser &&
						isUserRequest &&
						_.isEqual(
							currentUser[reqKey as keyof UserType] ?? "",
							req.body[reqKey],
						)) ||
					(post &&
						isPostRequest &&
						_.isEqual(post[reqKey as keyof PostType] ?? "", req.body[reqKey]))
				) {
					errorArray[reqKey] = [
						`${errorKey} has the same value as what's currently stored, try another.`,
					];
				}
			}
		}

		// Validate uploaded files
		if (reqMethod === "POST" || reqMethod === "PATCH") {
			if (
				Object.keys(req.body).some((param) => allowedMediaTypes.includes(param))
			) {
				if (isUserRequest) {
					errorArray.media = [
						"Either upload an avatar or/and a background image.",
					];
				}
				if (isPostRequest) {
					errorArray.media = [
						"Either upload a set of images, a set of files or a single video.",
					];
				}
			}

			if (req.files && Object.keys(req.files).length) {
				const files = req.files as {
					[fieldname: string]: Express.Multer.File[];
				};
				const mediaType = Object.keys(req.files)[0] as string;
				const mediaFiles = files[mediaType] as Express.Multer.File[];
				const allowedType = allowedFileTypes[
					mediaType as AllowedMediaTypesKeys
				] as string[];
				for (const file of mediaFiles) {
					const meta = await fileTypeFromFile(file.path);
					if (!allowedType.includes(meta?.ext as string)) {
						errorArray.media = [
							`${mediaType} must only have files with the following formats: ${allowedType.join(
								", ",
							)}.`,
						];
						break;
					}
				}
			}
		}

		if (Object.keys(errorArray).length) {
			throw new ErrorAO(errorArray, "ParameterError");
		}
		next();
	},
);
