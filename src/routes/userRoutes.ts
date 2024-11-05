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
} from "../controllers";
import {
	authMiddleware,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	userMulter,
} from "../middleware";

// Create a new express router
export const usersRoutes = express.Router();

// / USER ROUTES ///

// POST request for creating a new User.
usersRoutes.post(
	"/user",
	userMulter, // Middleware for handling file uploads
	jsonParserMiddleware, // Middleware for parsing JSON data
	requestCheckerMiddleware, // Middleware for checking parameters
	createUser,
);

// POST request for logging the user in.
usersRoutes.post(
	"/user/login",
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	loginUser,
);

// POST request for logging the user out.
usersRoutes.post(
	"/user/logout",
	authMiddleware, // Middleware for authentication
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	logoutUser,
);

// POST request for logging the user out from all sessions.
usersRoutes.post(
	"/user/self/logoutall",
	authMiddleware, // Middleware for authentication
	logoutAllUser,
);

// GET request for list of all Users.
usersRoutes.get(
	"/user",
	authMiddleware, // Middleware for authentication
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	getAllUsers,
);

// GET request for the authenticated User's details.
usersRoutes.get(
	"/user/self",
	authMiddleware, // Middleware for authentication
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	getSelfUser,
);

// GET request for one User by username.
usersRoutes.get(
	"/user/u/:username",
	authMiddleware, // Middleware for authentication
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	getUser,
);

// PATCH request to update User's password.
usersRoutes.patch(
	"/user/self/password",
	authMiddleware, // Middleware for authentication
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	patchUserPassword,
);

// PATCH request to update important User details.
usersRoutes.patch(
	"/user/self/important",
	authMiddleware, // Middleware for authentication
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	patchUserImportant,
);

// PATCH request to update regular User details.
usersRoutes.patch(
	"/user/self/regular",
	authMiddleware, // Middleware for authentication
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	patchUserRegular,
);

// DELETE request to delete the authenticated User.
usersRoutes.delete(
	"/user/self",
	authMiddleware, // Middleware for authentication
	deleteUser,
);

// DELETE request to partially delete User objects.
usersRoutes.delete(
	"/user/self/partial",
	authMiddleware, // Middleware for authentication
	userMulter,
	jsonParserMiddleware,
	requestCheckerMiddleware,
	deleteUserPartial,
);
