import type { Request } from "@/types";
import { ErrorAO, wrap } from "@/utils";
import type { NextFunction, Response } from "express";

export const validateParams = (routeConfig: {
	requiredParams: string[];
	optionalParams: string[];
}) =>
	wrap(async (req: Request, res: Response, next: NextFunction) => {
		const errorList: { [key: string]: string[] } = {};
		console.log("Validating params");
		console.log(routeConfig)
		const reqKeys = [
			...(req.body ? Object.keys(req.body) : []),
			...(req.files ? Object.keys(req.files) : []),
		];
		const routeMethod: string | undefined = req.method;

		const { requiredParams, optionalParams } = routeConfig;
		const parameterFreeRequest =
			!requiredParams.length && !optionalParams.length;

		// Check for unwanted parameters
		if (
			!reqKeys.every(
				(key) => requiredParams.includes(key) || optionalParams.includes(key),
			)
		) {
			throw new ErrorAO(
				{
					MAIN: ["Invalid request, got invalid parameters"],
				},
				"ParameterError",
				400,
			);
		}

		// Check for missing parameters
		if (!reqKeys.length && !parameterFreeRequest) {
			throw new ErrorAO(
				{
					MAIN: [
						`Missing all required parameters${
							requiredParams.length ? ` (${requiredParams.join(", ")})` : ""
						}.`,
					],
				},
				"ParameterError",
				400,
			);
		}

		if (
			optionalParams.length &&
			optionalParams.every((key: string) => !reqKeys.includes(key)) &&
			routeMethod === "PATCH"
		) {
			errorList.MAIN = [
				`Missing one of the following optional parameters: ${optionalParams.join(
					", ",
				)}`,
			];
		}

		for (const reqParam of requiredParams) {
			if (!reqKeys.includes(reqParam)) {
				errorList[reqParam] = [`${reqParam} is missing and it's needed`];
			}
		}

		if (errorList.length) {
			throw new ErrorAO(errorList, "ParameterError");
		}
		next();
	});
