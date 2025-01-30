import type { NextFunction, Response } from "express";
import type { Request } from "src/commom/generalTypes";
import { wrap } from "src/utils/generalUtils";
import { validateAndCheckPermissions } from "src/utils/permissionUtils";
import {
	validateParams,
	validatePassword,
	validatePatchRequests,
	validatePostRequests,
} from "src/utils/validationUtils";

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
	requiredParams: string[] | { [key: string]: string[] };
	optionalParams: string[] | { [key: string]: string[] };
}) =>
	wrap(async (req: Request, res: Response, next: NextFunction) => {
		req.errorList = {};
		await validateParams(req, routeConfig);

		const routePath: string | undefined = req.route?.path;
		if (routePath?.includes("/user")) {
			await validateAndCheckPermissions.user(req);
		} else if (routePath?.includes("/post")) {
			const post = await validateAndCheckPermissions.post(req);
			req.post = post === null ? undefined : post;
		} else if (routePath?.includes("/thread")) {
			const thread = await validateAndCheckPermissions.thread(req);
			req.thread = thread === null ? undefined : thread;
		} else if (routePath?.includes("/topic")) {
			const topic = await validateAndCheckPermissions.topic(req);
			req.topic = topic === null ? undefined : topic;
		}

		await validatePostRequests(req);
		await validatePatchRequests(req);
		await validatePassword(req);

		next();
	});
