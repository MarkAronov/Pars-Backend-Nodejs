// Import necessary modules and dependencies
import express from "express";

import {
	createPost,
	deletePost,
	getAllPosts,
	getOnePost,
	patchPost,
} from "../controllers";
import {
	authMiddleware,
	jsonParserMiddleware,
	postMulter,
	requestCheckerMiddleware,
} from "../middleware";

// Create a new express router
export const postRoutes = express.Router();

/// POST ROUTES ///

// POST request for creating a new Post.
postRoutes.post(
	"/post",
	authMiddleware, // Middleware for authentication
	postMulter, // Middleware for handling file uploads
	jsonParserMiddleware, // Middleware for parsing JSON data
	requestCheckerMiddleware, // Middleware for checking parameters
	createPost,
);

// GET request for list of all Post items.
postRoutes.get("/post", getAllPosts);

// GET request for a specific Post by ID.
postRoutes.get("/post/:id", getOnePost);

// PATCH request to update a Post by ID.
postRoutes.patch(
	"/post/:id",
	authMiddleware, // Middleware for authentication
	postMulter, // Middleware for handling file uploads
	jsonParserMiddleware, // Middleware for parsing JSON data
	requestCheckerMiddleware, // Middleware for checking parameters
	patchPost,
);

// DELETE request to delete a Post by ID.
postRoutes.delete(
	"/post/:id",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware, // Middleware for checking parameters
	deletePost,
);
