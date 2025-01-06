import type { Request } from "@/types";
import { wrap } from "@/utils";
import type { NextFunction, Response } from "express";
import {
	validateAndCheckPermissions,
	validateParams,
	validatePassword,
	validatePatchRequests,
} from ".";

/**
 * Middleware to check the parameters and files in the request.
 * Ensures that the required parameters are present, unwanted parameters are not included,
 * the parameters are valid, and the files are of allowed types.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const requestCheckerMiddleware = (routeConfig: {
	requiredParams: string[];
	optionalParams: string[];
}) =>
	wrap(async (req: Request, res: Response, next: NextFunction) => {
		req.errorList = {};
		await validateParams(routeConfig);

		const routePath: string | undefined = req.route?.path;
		if (routePath?.includes("/user")) {
			await validateAndCheckPermissions.user(req);
		} else if (routePath?.includes("/post")) {
			await validateAndCheckPermissions.post(req);
		} else if (routePath?.includes("/thread")) {
			await validateAndCheckPermissions.thread(req);
		} else if (routePath?.includes("/topic")) {
			await validateAndCheckPermissions.topic(req);
		}

		await validatePatchRequests();
		await validatePassword();
		next();
	});
