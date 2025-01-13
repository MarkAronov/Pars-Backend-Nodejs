// Import necessary modules and dependencies
import express from "express";

import {
	createUser,
	deleteUser,
	deleteUserPartial,
	getAllUsers,
	getSelfUser,
	getUser,
	loginUser,
	logoutAllUser,
	logoutUser,
	patchUserImportant,
	patchUserPassword,
	patchUserRegular,
} from "@/controllers";
import { authMiddleware, requestCheckerMiddleware } from "@/middleware";

const userOptionalParams = [
	"displayName",
	"bio",
	"hideWhenMade",
	"hidePosts",
	"avatar",
	"backgroundImage",
];

// Create a new express router

export const usersRoutes = express.Router();

// / USER ROUTES ///

// POST request for creating a new User.
usersRoutes.post(
	"/user",
	requestCheckerMiddleware({
		requiredParams: ["email", "username", "password"],
		optionalParams: userOptionalParams,
	}), // Middleware for checking parameters
	createUser,
);

// POST request for logging the user in.
usersRoutes.post(
	"/user/login",
	requestCheckerMiddleware({
		requiredParams: ["email", "password"],
		optionalParams: [],
	}),
	loginUser,
);

// POST request for logging the user out.
usersRoutes.post(
	"/user/logout",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["email", "username", "password"],
		optionalParams: [],
	}),
	logoutUser,
);

// POST request for logging the user out from all sessions.
usersRoutes.post(
	"/user/logoutall",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}),
	logoutAllUser,
);

// GET request for list of all Users.
usersRoutes.get(
	"/users",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["requestedFields"],
		optionalParams: [],
	}),
	getAllUsers,
);

// GET request for the authenticated User's details.
usersRoutes.get(
	"/user/self",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}),
	getSelfUser,
);

// GET request for one User by username.
usersRoutes.get(
	"/user/u/:username",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["requestedFields"],
		optionalParams: [],
	}),
	getUser,
);

// PATCH request to update important User details.
usersRoutes.patch(
	"/user/important",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["password"],
		optionalParams: ["email", "username"],
	}),
	patchUserImportant,
);

// PATCH request to update User password.
usersRoutes.patch(
	"/user/password",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["currentPassword", "newPassword"],
		optionalParams: [],
	}),
	patchUserPassword,
);

// PATCH request to update regular User details.
usersRoutes.patch(
	"/user/regular",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: userOptionalParams,
	}),
	patchUserRegular,
);

// DELETE request to delete a User.
usersRoutes.delete(
	"/user",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}),
	deleteUser,
);

// DELETE request to partially delete a User.
usersRoutes.delete(
	"/user/partial",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["avatar", "backgroundImage"],
		optionalParams: [],
	}),
	deleteUserPartial,
);
