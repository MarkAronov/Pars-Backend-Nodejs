import type { Request } from "@/types";
import { ErrorAO, filterDupes, wrap } from "@/utils";
import bcrypt from "bcryptjs";
import type { NextFunction, Response } from "express";
import _ from "lodash";

export const validatePatchRequests = async () =>
	wrap(async (req: Request, res: Response, next: NextFunction) => {
		const errorList: { [key: string]: string[] } = {};
		const reqKeys = [
			...(req.body ? Object.keys(req.body) : []),
			...(req.files ? Object.keys(req.files) : []),
		];
		const reqMethod = req.method;
		const currentUser = req.user;
		const post = req.post;

		if (reqMethod === "PATCH") {
			for (const reqKey of reqKeys) {
				const errorKey = (reqKey.charAt(0).toUpperCase() +
					reqKey.slice(1)) as string;

				if (
					reqKey === "filesToRemove" &&
					req.path.includes("/post") &&
					req.files !== undefined &&
					Object.keys(req.files).length
				) {
					const filesToRemove = filterDupes(req.body.filesToRemove.slice());
					const mediaType = Object.keys(req.files)[0];

					if (
						!post?.media.every((file) => filesToRemove.includes(file)) &&
						mediaType !== post?.mediaType
					) {
						errorList.media = [
							"You can't have multiple media types in the same post",
						];
					}
				}

				if (
					(currentUser &&
						req.path.includes("/user") &&
						_.isEqual(
							currentUser[reqKey as keyof typeof currentUser] ?? "",
							req.body[reqKey],
						)) ||
					(post &&
						req.path.includes("/post") &&
						_.isEqual(
							post[reqKey as keyof typeof post] ?? "",
							req.body[reqKey],
						))
				) {
					errorList[errorKey] = [
						`${errorKey} has the same value as what's currently stored, try another.`,
					];
				}
			}
		}

		if (Object.keys(errorList).length) {
			throw new ErrorAO(errorList, "ParameterError", 400);
		}
		next();
	});
