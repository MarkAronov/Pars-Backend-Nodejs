import fs from "node:fs";
import path from "node:path";
import type { Response } from "express";
import { fileTypeFromFile } from "file-type";

import { User } from "../models/userModel";
import { ErrorAO,  wrap } from "../utils";

import type {
	IUser,
	Request,
	UserMediaTypeKeys,
	UserPartialDeleteTypeKeys,
	UserRegularPatchTypeKeys,
	UserType,
} from "../types";

export const createUser = wrap(async (req: Request, res: Response) => {
	const userData = req.body;
	userData.displayName = req.body.displayName || req.body.username;
	const createdUser = new User(userData);

	// Handle file uploads
	if (req.files && Object.keys(req.files).length) {
		const files = req.files as { [fieldname: string]: Express.Multer.File[] };
		const mediaTypes = Object.keys(files);

		for (const mediaType of mediaTypes) {
			const filesArray = files[mediaType];
			if (filesArray && filesArray.length > 0) {
				const file = filesArray[0];
				const fileFolderPath = path.join(process.cwd(), `/media/${mediaType}s`);
				const filename = file?.filename;
				const meta = await fileTypeFromFile(file?.path as string);
				const newFilename = `${filename}.${meta?.ext}`;
				await fs.rename(
					`${fileFolderPath}/${filename}`,
					`${fileFolderPath}/${newFilename}`,
					() => {},
				);
				// Update the file information in the request object and user data
				if (file) file.filename = path.join(fileFolderPath, newFilename);
				createdUser[mediaType as UserMediaTypeKeys] = newFilename;
			}
		}
	}

	await createdUser.save();

	const user = createdUser.toLimitedJSON(2);
	const token = await createdUser.generateToken();
	return res.status(201).send({ user, token });
});

export const loginUser = wrap(async (req: Request, res: Response) => {
	const userToLimit = await User.verifyCredentials(
		req.body.email,
		req.body.password,
	);

	const user = userToLimit.toLimitedJSON(2);
	const token = await userToLimit.generateToken();

	return res.status(200).send({ user, token });
});

export const logoutUser = wrap(async (req: Request, res: Response) => {
	if (req.user) {
		req.user.tokens = (req.user.tokens as { token: string }[])?.filter(
			(tokens) => tokens.token !== req.token,
		);

		await req.user.save();
	}

	return res.status(200).send();
});

export const logoutAllUser = wrap(async (req: Request, res: Response) => {
	if (req.user) {
		req.user.tokens = [];
		await req.user.save();
	}
	return res.status(200).send();
});

export const getAllUsers = wrap(async (req: Request, res: Response) => {
	const users: UserType[] = await User.find({});
	for (const user of users) {
		user.toLimitedJSON(2);
	}
	return res.status(200).send(users);
});

export const getSelfUser = wrap(async (req: Request, res: Response) => {
	let trimmedUser: Partial<UserType> = {};
	if (req.user) {
		await req.user.populate("posts");
		if (req.body.requestedFields) {
			const userKeys = Object.keys(req.user.toLimitedJSON(0));
			for (const userKey of userKeys)
				if (req.user && req.body.requestedFields.includes(userKey)) {
					let trimmedUserVal = trimmedUser[userKey as keyof Partial<IUser>];
					if (trimmedUserVal) trimmedUserVal = req.user[userKey as keyof IUser];
				}
		} else {
			trimmedUser = req.user.toLimitedJSON(0);
		}
	}
	return res.status(200).send(trimmedUser);
});

export const getUser = wrap(async (req: Request, res: Response) => {
	const user = await User.findOne({ username: req.params.username });
	if (!user) {
		throw new ErrorAO(
			{
				ERROR: [`No user with that name: ${req.params.username}`],
			},
			"SearchError",
		);
	}

	return res.status(200).send(user.toLimitedJSON(2));
});

export const patchUserPassword = wrap(async (req: Request, res: Response) => {
	if (req.user) {
		await req.user.verifyPassword(req.body.currentPassword);

		req.user.password = req.body.newPassword;

		await req.user.save();
	}
	return res.status(200).send();
});

export const patchUserImportant = wrap(async (req: Request, res: Response) => {
	if (req.user) {
		await req.user.verifyPassword(req.body.password);

		const reqKeys = Object.keys(req.body);
		for (const reqKey of reqKeys) {
			if (reqKey !== "password" && req.user) {
				req.user[reqKey as keyof IUser] = req.body[reqKey];
			}
		}

		await req.user.save();
		return res.status(200).send(req.user.toLimitedJSON(2));
	}
	return res.status(200).send();
});

export const patchUserRegular = wrap(async (req: Request, res: Response) => {
	const userData = req.body;
	const reqKeys = Object.keys(userData);
	if (req.user) {
		for (const reqKey of reqKeys) {
			req.user[reqKey as UserRegularPatchTypeKeys] = req.body[reqKey];
		}

		// Handle file uploads
		if (req.files && Object.keys(req.files).length) {
			const files = req.files as {
				[fieldname: string]: Express.Multer.File[];
			};
			const mediaTypes = Object.keys(files);

			for (const mediaType of mediaTypes) {
				const filesArray = files[mediaType];
				if (filesArray && filesArray.length > 0) {
					const file = filesArray[0];
					const fileFolderPath = path.join(process.cwd(), `/media/${mediaType}s`);
					let filename = file?.filename;
					const meta = await fileTypeFromFile(file?.path as string);
					const newFilename = `${filename}.${meta?.ext}`;

					await fs.rename(
						`${fileFolderPath}/${filename}`,
						`${fileFolderPath}/${newFilename}`,
						() => {},
					);

					filename = `${fileFolderPath}\\${filename}.${meta?.ext}`;

					if (req.user[mediaType as UserMediaTypeKeys]) {
						await fs.rm(
							`${req.user[mediaType as UserMediaTypeKeys]}`,
							() => {},
						);
					}

					req.user[mediaType as UserMediaTypeKeys] = filename;
				}
			}
		}
		await req.user.save();
		return res.status(200).send(req.user.toLimitedJSON(2));
	}
	return res.status(200).send();
});

export const deleteUser = wrap(async (req: Request, res: Response) => {
	await req?.user?.deleteOne();
	return res.status(200).send();
});

export const deleteUserPartial = wrap(async (req: Request, res: Response) => {
	if (req.user && req.body.requestedFields) {
		const userKeys = Object.keys(req.user.toLimitedJSON(0));
		for (const userKey of userKeys) {
			if (req.body.requestedFields.includes(userKey)) {
				if (userKey === "avatar" || userKey === "backgroundImage") {
					const filePath = path.join(
						process.cwd(),
						`/media/${userKey}s/${req.user[userKey as UserMediaTypeKeys]}`,
					);
					fs.rm(filePath, () => {});
					req.user[userKey as UserMediaTypeKeys] = null;
				} else {
					req.user[userKey as UserPartialDeleteTypeKeys] = null;
				}
			}
		}

		await req.user.save();
	}
	return res.status(200).send();
});
