import * as crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Response } from "express";
import { fileTypeFromBuffer } from "file-type/core";
import multer from "multer";
import type { Request } from "src/commom/generalTypes";
import { ErrorAO, wrap } from "src/utils/generalUtils";

/// MULTER SETTINGS ///
const megabyte = 1000000;

const allowedFileTypes = {
	avatar: ["jpg", "jpeg", "png"],
	backgroundImage: ["jpg", "jpeg", "png"],
	videos: ["mp4"],
	images: ["jpg", "jpeg", "png"],
	datafiles: ["pdf", "doc", "docx"],
	image: ["jpg", "jpeg", "png"],
};

export const validateUploadedFiles = wrap(
	async (req: Request, res: Response, next: NextFunction) => {
		let errorList: { [key: string]: string[] } = {};
		const filesGroupedByMediaType = req.files as {
			[fieldname: string]: Express.Multer.File[];
		};
		if (
			filesGroupedByMediaType &&
			(req.path.includes("/post") || req.path.includes("/thread")) &&
			Object.keys(filesGroupedByMediaType).length > 1
		) {
			throw new ErrorAO(
				{
					media: [
						"Either upload a set of images, a set of files or a single video",
					],
				},
				"ParameterError",
				400,
			);
		}
		for (const mediaType in filesGroupedByMediaType) {
			const files = filesGroupedByMediaType[mediaType];
			for (const fileNum in files) {
				const file = files[fileNum];
				const mediaType = file.fieldname;
				const allowedTypes =
					allowedFileTypes[mediaType as keyof typeof allowedFileTypes];

				if (!allowedTypes) {
					errorList = req.errorList || {};
					if (req.path.includes("/user")) {
						errorList.media = [
							"Either upload an avatar or/and a background image.",
						];
					}
					if (req.path.includes("/post") || req.path.includes("/thread")) {
						errorList.media = [
							"Either upload a set of images, a set of files or a single video.",
						];
					}
					if (req.path.includes("/topic")) {
						errorList.media = ["Only upload a cover."];
					}
				}

				if (file.buffer) {
					const fileType = await fileTypeFromBuffer(
						new Uint8Array(file.buffer),
					);
					if (!fileType || !allowedTypes.includes(fileType.ext)) {
						errorList = errorList || {};
						errorList.media = errorList.media || [];
						errorList.media.push(
							`Invalid file type (${fileType?.ext}) for file: ${file.originalname}`,
						);
					}
					file.originalname = `${file.originalname}.${fileType?.ext}`;
				}
			}
		}
		if (Object.keys(errorList).length) {
			throw new ErrorAO(errorList, "ParameterError", 400);
		}
		await saveFilesToDisk(req, res, next);
	},
);

/**
 * Multer storage configuration for saving uploaded files.
 * - Uses memory storage to keep files in memory.
 */
const storage = multer.memoryStorage();

/**
 * Middleware to save files to disk after validation.
 */
const saveFilesToDisk = wrap(
	async (req: Request, res: Response, next: NextFunction) => {
		if (!req.files) {
			return next();
		}

		const filesGroupedByMediaType = req.files as {
			[fieldname: string]: Express.Multer.File[];
		};

		for (const mediaType in filesGroupedByMediaType) {
			const files = filesGroupedByMediaType[mediaType];
			const mediaFolderPath = path.join(process.cwd(), "/media/", mediaType);

			if (!fs.existsSync(mediaFolderPath)) {
				fs.mkdirSync(mediaFolderPath, { recursive: true });
			}

			for (const file of files) {
				const uniqueSuffix = crypto.randomBytes(16).toString("hex");
				const filename = `${file.fieldname}-${Date.now()}-${uniqueSuffix}.${file.originalname.split(".").pop()}`;
				const filePath = path.join(mediaFolderPath, filename);

				await fs.promises.writeFile(filePath, new Uint8Array(file.buffer));
				file.path = filePath;
				file.filename = filename;
			}
		}

		next();
	},
);

/**
 * Multer middleware for handling file uploads for user-related routes.
 * Limits the file size to 10 MB and allows up to 2 files.
 */
const userMulter = multer({
	limits: {
		fileSize: 10 * megabyte,
		files: 2,
	},
	storage: storage,
}).fields([
	{ name: "avatar", maxCount: 1 },
	{ name: "backgroundImage", maxCount: 1 },
]);

/**
 * Multer middleware for handling file uploads for post-related routes.
 * Limits the file size to 75 MB and allows up to 5 files.
 */
const postMulter = multer({
	limits: {
		fileSize: 75 * megabyte,
		files: 5,
	},
	storage: storage,
}).fields([
	{ name: "videos", maxCount: 1 },
	{ name: "images", maxCount: 5 },
	{ name: "datafiles", maxCount: 3 },
]);

/**
 * Multer middleware for handling file uploads for topic-related routes.
 * Limits the file size to 75 MB and allows only 1 file.
 */
const topicMulter = multer({
	limits: {
		fileSize: 75 * megabyte,
		files: 5,
	},
	storage: storage,
}).fields([{ name: "cover", maxCount: 1 }]);

/**
 * Dynamic Multer middleware to handle file uploads based on the request path.
 */
export const dynamicMulter = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const multerMiddleware =
		((req.path.includes("/post") || req.path.includes("/thread")) &&
			postMulter) ||
		(req.path.includes("/topic") && topicMulter) ||
		(req.path.includes("/user") && userMulter);

	if (multerMiddleware && (req.method === "POST" || req.method === "PATCH")) {
		multerMiddleware(req, res, async (err) => {
			if (err) {
				return next(err);
			}
			await validateUploadedFiles(req, res, next);
		});
	} else {
		next();
	}
};
