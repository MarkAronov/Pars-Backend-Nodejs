import fs from "node:fs";
import type { NextFunction, Response } from "express";
import type { Request, ValidationError } from "../types";
import type { MulterError } from "multer";
import type { ErrorAO } from "@/utils";

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
	err:
		| ErrorAO
		| ValidationError
		| MulterError,
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
	}

	// Handle validation errors
	if (err.name === "ValidationError") {
		const errorArray = (err as ValidationError).errors;
		const parsedErrorArray: { [key: string]: string[] } = {};
		const errorKeys: string[] = Object.keys(errorArray);
		for (const errorKey of errorKeys) {
			const CapKey = errorKey.charAt(0).toUpperCase() + errorKey.slice(1);

			const errExtract = errorArray[errorKey].properties.reason;
			if (errExtract) {
				parsedErrorArray[errorKey] = errExtract.errorAO;
			}

			const dupeMessage = errorArray[errorKey].properties.message;
			if (dupeMessage === "dupe") {
				parsedErrorArray[errorKey] = [
					`${CapKey} is being currently used, use a different one`,
				];
			}

			if (
				errorArray[errorKey].kind === "maxlength" &&
				errorKey !== "displayName"
			) {
				parsedErrorArray[errorKey] = [errorArray[errorKey].properties.message];
			}

			if (errorArray[errorKey].properties.type === "required") {
				parsedErrorArray[errorKey] = [`${CapKey} is empty`];
			}
		}
		return res.status(400).send({
			ERROR: parsedErrorArray,
		});
	}
	if (err.name === "SearchError") {
		return res.status(404).send();
	}
	// Handle Multer errors
	if (err.name === "MulterError") {
		const errorMessages: { [index: string]: string } = {
			LIMIT_PART_COUNT: "Too many parts",
			LIMIT_FILE_SIZE: "File too large",
			LIMIT_FILE_COUNT: "Too many files",
			LIMIT_FIELD_KEY: "Field name too long",
			LIMIT_FIELD_VALUE: "Field value too long",
			LIMIT_FIELD_COUNT: "Too many fields",
			LIMIT_UNEXPECTED_FILE: "Unexpected file",
			MISSING_FIELD_NAME: "Field name missing",
		};
		if ((err as MulterError).code) {
			const errMsg = errorMessages[(err as MulterError).code];
			if (errMsg) return res.status(400).send({ media: [errMsg] });
		}
		return {};
	}
	// Handle pre-composed errors
	if (preComposedErrors.includes(err.name)) {
		return res.status((err as ErrorAO).status || 500).send({ ERROR: (err as ErrorAO).errorAO });
	}
	// Handle generic server errors
	return res.status(500).send(err.toString());
};
