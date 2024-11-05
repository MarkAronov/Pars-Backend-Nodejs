import type { ParameterList } from "../types";

// Helper function to create parameter configuration
const createParams = (
	requiredParams: string[],
	optionalParams: string[] = [],
) => ({
	requiredParams,
	optionalParams,
});

const userParams = [
	"displayName",
	"bio",
	"hideWhenMade",
	"hidePosts",
	"avatar",
	"backgroundImage",
];

const postParams = [
	"title",
	"content",
	"mentionedParents",
	"images",
	"videos",
	"datafiles",
];

export const requestMap: ParameterList = {
	POST: {
		"/user": createParams(["email", "username", "password"], userParams),
		"/user/login": createParams(["email", "password"]),
		"/user/logout": createParams([]),
		"/user/logoutall": createParams([]),
		"/post": createParams(["topic", "thread", "title"], postParams),
		"/thread": createParams(["topic", "title"], postParams),
		"/topic": createParams([]),
	},
	GET: {
		"/user": createParams([], ["requestedFields"]),
		"/user/self": createParams([], ["requestedFields"]),
		"/user/u/:username": createParams([], ["requestedFields"]),
		"/post": createParams([]),
		"/post/:id": createParams([]),
		"/thread/:id": createParams([]),
		"/topic/:name": createParams([]),
	},
	PATCH: {
		"/user/self/password": createParams(["currentPassword", "newPassword"]),
		"/user/self/important": createParams(["password"], ["email", "username"]),
		"/user/self/regular": createParams([], [...userParams, "settings"]),
		"/post/:id": createParams([], [...postParams, "filesToRemove"]),
	},
	DELETE: {
		"/user/self": createParams([]),
		"/user/self/partial": createParams(["requestedFields"]),
		"/post/:id": createParams([]),
		"/thread/:id": createParams([]),
		"/topic/:name": createParams([]),
	},
};

export const requestedUserGETFields = [
	"email",
	"username",
	"displayName",
	"bio",
	"hideWhenMade",
	"hidePosts",
	"avatar",
	"backgroundImage",
];

export const requestedUserDELETEFields = ["bio", "avatar", "backgroundImage"];

export const allowedFileTypes = {
	avatar: ["png", "jpg", "gif"],
	backgroundImage: ["png", "jpg", "gif"],
	images: ["png", "jpg", "gif"],
	videos: ["mp4", "webm"],
	datafiles: ["pdf", "zip"],
};

export const allowedMediaTypes = [
	"avatar",
	"backgroundImage",
	"images",
	"videos",
	"datafiles",
];
