// Import necessary modules and dependencies
import express from "express";

import { createThread, deleteThread, getThread } from "@/controllers";
import { authMiddleware, requestCheckerMiddleware } from "@/middleware";
import { postParams } from ".";

// Create a new express router
export const threadsRoutes = express.Router();

/// POST ROUTES ///

// POST request for creating a new Post.
threadsRoutes.post(
	"/thread",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["topic", "title"],
		optionalParams: postParams,
	}), // Middleware for checking parameters
	createThread,
);

// GET request for a specific Post by ID.
threadsRoutes.get(
	"/thread/:id",
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}), // Middleware for checking parameters
	getThread,
);

// DELETE request to delete a Post by ID.
threadsRoutes.delete(
	"/thread/:id",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}), // Middleware for checking parameters
	deleteThread,
);
