import * as crypto from "node:crypto";
import multer from "multer";

/// MULTER SETTINGS ///
const megabyte = 1000000;

/**
 * Multer storage configuration for saving uploaded files.
 * - Determines the destination folder based on the request route.
 * - Generates a unique filename using the field name, current timestamp, and a random suffix.
 */
const storage = multer.diskStorage({
	/**
	 * Set the destination folder for the uploaded files.
	 * If the request route contains '/user', the folder will be pluralized.
	 *
	 * @param {Request} req - The Express request object.
	 * @param {File} file - The file being uploaded.
	 * @param {Function} cb - Callback to set the destination folder.
	 */
	destination: async (req, file, cb: (arg0: null, arg1: string) => void) => {
		const isUserRoute = req.route.path.toString().indexOf("/user") >= 0;
		const folder = `./media/${file.fieldname}${isUserRoute ? "s" : ""}`;
		cb(null, folder);
	},
	/**
	 * Set the filename for the uploaded file.
	 * Generates a unique filename using the field name, current timestamp, and a random suffix.
	 *
	 * @param {Request} req - The Express request object.
	 * @param {File} file - The file being uploaded.
	 * @param {Function} cb - Callback to set the filename.
	 */
	filename: async (req, file, cb: (arg0: null, arg1: string) => void) => {
		const uniqueSuffix = crypto.randomBytes(16).toString("hex");
		cb(null, `${file.fieldname}-${Date.now()}-${uniqueSuffix}`);
	},
});

/// MULTER MIDDLEWARES ///

/**
 * Multer middleware for handling file uploads for user-related routes.
 * Limits the file size to 10 MB and allows up to 2 files.
 */
export const userMulter = multer({
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
export const postMulter = multer({
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
 * Limits the file size to 75 MB and allow only 1 file.
 */
export const TopicMulter = multer({
	limits: {
		fileSize: 75 * megabyte,
		files: 5,
	},
	storage: storage,
}).fields([{ name: "image", maxCount: 1 }]);
