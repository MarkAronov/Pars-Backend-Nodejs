import bcrypt from "bcryptjs";
import _ from "lodash";
import { Thread } from "src/api/thread/thread.model";
import type { Request } from "src/commom/generalTypes";
import { ErrorAO, filterDupes } from "./generalUtils";

export const validateParams = async (
	req: Request,
	routeConfig: {
		requiredParams: string[] | { [key: string]: string[] };
		optionalParams: string[] | { [key: string]: string[] };
	},
) => {
	const errorList: { [key: string]: string[] } = {};
	const reqKeys = [
		...(req.body ? Object.keys(req.body) : []),
		...(req.files ? Object.keys(req.files) : []),
	];
	const routeMethod: string | undefined = req.method;

	const { requiredParams, optionalParams } = routeConfig;
	const parameterFreeRequest = !requiredParams.length && !optionalParams.length;
	// Check for unwanted parameters
	if (
		!reqKeys.every(
			(key) =>
				(Array.isArray(requiredParams) &&
					requiredParams.some((param) =>
						typeof param === "string" ? param === key : key in param,
					)) ||
				(Array.isArray(optionalParams) &&
					optionalParams.some((param) =>
						typeof param === "string" ? param === key : key in param,
					)),
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
						Array.isArray(requiredParams) && requiredParams.length
							? ` (${requiredParams.join(", ")})`
							: ""
					}.`,
				],
			},
			"ParameterError",
			400,
		);
	}

	if (
		Array.isArray(optionalParams) &&
		optionalParams.length &&
		optionalParams.every((param: string | { [key: string]: string[] }) =>
			typeof param === "string"
				? !reqKeys.includes(param)
				: !Object.keys(param).some((key) => reqKeys.includes(key)),
		) &&
		routeMethod === "PATCH"
	) {
		errorList.MAIN = [
			`Missing one of the following optional parameters: ${optionalParams.join(
				", ",
			)}`,
		];
	}

	if (Array.isArray(requiredParams)) {
		for (const reqParam of requiredParams) {
			if (!reqKeys.includes(reqParam)) {
				errorList[reqParam] = [`${reqParam} is missing and it's needed`];
			}
		}
	} else {
		for (const [reqParam, _] of Object.entries(requiredParams)) {
			if (!reqKeys.includes(reqParam)) {
				errorList[reqParam] = [`${reqParam} is missing and it's needed`];
			}
		}
	}

	if (Object.keys(errorList).length) {
		throw new ErrorAO(errorList, "ParameterError");
	}
};

export const validatePostRequests = async (req: Request) => {
	const errorList: { [key: string]: string[] } = {};
	if (req.method === "POST") {
		const post = req.post;
		if (post && req.path.includes("/post")) {
			const thread = await Thread.findById(post?.thread);
			if (thread?.locked) {
				errorList.MAIN = ["Thread is locked"];
			}
		}
	}

	if (Object.keys(errorList).length) {
		throw new ErrorAO(errorList, "ParameterError", 400);
	}
};

export const validatePatchRequests = async (req: Request) => {
	const errorList: { [key: string]: string[] } = {};
	if (req.method === "PATCH") {
		const reqKeys = [
			...(req.body ? Object.keys(req.body) : []),
			...(req.files ? Object.keys(req.files) : []),
		];
		const currentUser = req.user;
		const post = req.post;
		for (const reqKey of reqKeys) {
			const errorKey = (reqKey.charAt(0).toUpperCase() +
				reqKey.slice(1)) as string;

			if (
				reqKey === "filesToRemove" &&
				req.path.includes("/post") &&
				req.files !== undefined &&
				Object.keys(req.files).length
			) {
				const filesToRemove = filterDupes(req.body.filesToRemove.slice());
				const mediaType = Object.keys(req.files)[0];

				if (
					!post?.media.every((file: string) => filesToRemove.includes(file)) &&
					mediaType !== post?.mediaType
				) {
					errorList.media = [
						"You can't have multiple media types in the same post",
					];
				}
			}

			if (
				(currentUser &&
					req.path.includes("/user") &&
					_.isEqual(
						currentUser[reqKey as keyof typeof currentUser] ?? "",
						req.body[reqKey],
					)) ||
				(post &&
					req.path.includes("/post") &&
					_.isEqual(post[reqKey as keyof typeof post] ?? "", req.body[reqKey]))
			) {
				errorList[errorKey] = [
					`${errorKey} has the same value as what's currently stored, try another.`,
				];
			}
		}
	}

	if (Object.keys(errorList).length) {
		throw new ErrorAO(errorList, "ParameterError", 400);
	}
};

export const validatePassword = async (req: Request) => {
	const currentUser = req.user;
	const newPassword = req.body.newPassword;
	if (currentUser && newPassword) {
		const formerPasses = currentUser.formerPasswords;
		if (formerPasses) {
			for (const formerPass of formerPasses as string[]) {
				if (await bcrypt.compare(newPassword, formerPass)) {
					req.errorList = req.errorList || {};
					req.errorList.password = [
						"This password was previously used, use another.",
					];
				}
			}
		}
	}
};
