import * as crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Request } from "@/types";
import type { NextFunction, Response } from "express";
import { fileTypeFromBuffer } from "file-type/core";
import multer from "multer";
import type { MulterError } from "multer";
/// MULTER SETTINGS ///
const megabyte = 1000000;

const allowedFileTypes = {
	avatar: ["jpg", "jpeg", "png"],
	backgroundImage: ["jpg", "jpeg", "png"],
	videos: ["mp4"],
	images: ["jpg", "jpeg", "png"],
	datafiles: ["pdf", "doc", "docx"],
	cover: ["jpg", "jpeg", "png"],
};

/**
 * Multer storage configuration for saving uploaded files.
 * - Uses memory storage to keep files in memory.
 */
const storage = multer.memoryStorage();

/**
 * Middleware to save files to disk after validation.
 */
const saveFilesToDisk = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!req.files) {
		return next();
	}

	const filesGroupedByMediaType = req.files as {
		[fieldname: string]: Express.Multer.File[];
	};

	for (const mediaType in filesGroupedByMediaType) {
		const files = filesGroupedByMediaType[mediaType];
		const mediaFolderPath = path.join(__dirname, "../../media", mediaType);

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
};

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
export function dynamicMulter(req: Request, res: Response, next: NextFunction) {
	const multerMiddleware =
		((req.path.includes("/post") || req.path.includes("/thread")) &&
			postMulter) ||
		(req.path.includes("/topic") && topicMulter) ||
		(req.path.includes("/user") && userMulter);

	if (multerMiddleware && (req.method === "POST" || req.method === "PATCH")) {
		multerMiddleware(req, res, (err) => {
			if (err) {
				return next(err);
			}
			saveFilesToDisk(req, res, next);
		});
	} else {
		next();
	}
}
