import type { NextFunction, Response } from "express";
import type { MulterError } from "multer";
import type { Request, ValidationError } from "../types";
import {
	multerErrorComposer,
	removeFiles,
	validationErrorComposer,
} from "../utils";

/**
 * Error-handling middleware for Express applications.
 * Handles various types of errors and sends appropriate responses to the client.
 * Cleans up uploaded files if necessary and logs the error for debugging purposes.
 *
 * @param {any} err - The error object caught by the middleware.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function (unused).
 */
export const errorHandlerMiddleware = async (
	err: Error & { status?: number; errorAO?: unknown; name: string },
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const preComposedErrors = [
		"AuthenticationError",
		"ParameterError",
		"VerificationError",
	];

	const urlsThatUploadFiles = [
		"/user",
		"/user/self/regular",
		"/post",
		"/post/:id",
	];

	// Handle requests for non-existent media files
	if (req.route.path === "/media/:mediatype/:mediafile") {
		return res.status(404).send({
			media: "file does not exist",
		});
	}

	// Remove uploaded files if the request fails and involves file uploads
	if (
		urlsThatUploadFiles.includes(req.route.path) &&
		(req.method === "POST" || req.method === "PATCH")
	) {
		await removeFiles(req);
	}

	// Handle validation errors
	if (err.name === "ValidationError") {
		return res.status(400).send({
			ERROR: validationErrorComposer(err as unknown as ValidationError),
		});
	}
	if (err.name === "SearchError") {
		return res.status(404).send();
	}
	// Handle Multer errors
	if (err.name === "MulterError") {
		return res.status(400).send(multerErrorComposer(err as MulterError));
	}
	// Handle pre-composed errors
	if (preComposedErrors.includes(err.name)) {
		return res.status(err.status || 500).send({ ERROR: err.errorAO });
	}
	// Handle generic server errors
	return res.status(500).send(err.toString());
};
