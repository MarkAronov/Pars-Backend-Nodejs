import type { NextFunction, Response } from "express";
import type { Request } from "../types";
import { ErrorAO } from "../utils";

/**
 * Middleware to parse JSON content from a request body.
 * Checks if the request body contains a 'content' field and parses it as JSON.
 * Merges the parsed JSON content with the rest of the request body.
 * Throws an error if the JSON content is invalid.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */

export const jsonParserMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (req.body && Object.keys(req.body).includes("content")) {
		try {
			const reqJSONContent =
				typeof JSON.parse(req.body.content) === "string"
					? JSON.parse(JSON.parse(req.body.content))
					: JSON.parse(req.body.content);

			// Remove the 'content' field from the request body
			// Create a new object without the 'content' field
			const { content, ...rest } = req.body;

			// Merge the parsed JSON content with the rest of the request body
			req.body = Object.assign({}, rest, reqJSONContent);
		} catch (err) {
			throw new ErrorAO({ MAIN: ["invalid JSON string"] }, "ParameterError");
		}
	}
	next();
};
