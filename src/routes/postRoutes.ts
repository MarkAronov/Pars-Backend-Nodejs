// Import necessary modules and dependencies
import express from "express";

import {
	createPost,
	deletePost,
	getAllPosts,
	getOnePost,
	patchPost,
} from "@/controllers";
import { authMiddleware, requestCheckerMiddleware } from "@/middleware";

export const postParams = [
	"title",
	"content",
	"mentionedParents",
	"images",
	"videos",
	"datafiles",
];

// Create a new express router
export const postRoutes = express.Router();

/// POST ROUTES ///

// POST request for creating a new Post.
postRoutes.post(
	"/post",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["topic", "thread", "title"],
		optionalParams: postParams,
	}), // Middleware for checking parameters
	createPost,
);

// GET request for list of all Post items.
postRoutes.get(
	"/post",
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}),
	getAllPosts,
);

// GET request for a specific Post by ID.
postRoutes.get(
	"/post/:id",
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}),
	getOnePost,
);

// PATCH request to update a Post by ID.
postRoutes.patch(
	"/post/:id",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [...postParams, "filesToRemove"]
	}), // Middleware for checking parameters
	patchPost,
);

// DELETE request to delete a Post by ID.
postRoutes.delete(
	"/post/:id",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}), // Middleware for checking parameters
	deletePost,
);
