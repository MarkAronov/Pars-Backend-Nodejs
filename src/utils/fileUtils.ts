import fs from "node:fs";
// import { dirname } from "node:path";
// import { fileURLToPath } from "node:url";
import type { Request } from "../types";

/**
 * Returns the directory name of the current module.
 * @returns {string} The directory name.
 */
// export const dirName = () => dirname(fileURLToPath(import.meta.url));
export const dirName = () => process.cwd();

/**
 * Removes uploaded files from the server.
 * @param {Request} req - The request object containing the files to be removed.
 */
export const removeFiles = async (req: Request) => {
	if (!req.files) return;

	const filesGroupedByMediaType = req.files as {
		[fieldname: string]: Express.Multer.File[];
	};

	await Promise.all(
		Object.keys(filesGroupedByMediaType).map(async (mediaType: string) => {
			const files = filesGroupedByMediaType[mediaType];
			if (files)
				await Promise.all(files.map((file) => fs.rm(file.path, () => {})));
		}),
	);
};
