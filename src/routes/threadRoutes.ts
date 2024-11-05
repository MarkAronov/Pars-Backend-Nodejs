// Import necessary modules and dependencies
import express from "express";

import { createThread } from "../controllers";
import {
	authMiddleware,
	jsonParserMiddleware,
	postMulter,
	requestCheckerMiddleware,
} from "../middleware";

// Create a new express router
export const threadsRoutes = express.Router();

/// POST ROUTES ///

// POST request for creating a new Post.
threadsRoutes.post(
	"/thread",
	authMiddleware, // Middleware for authentication
	postMulter, // Middleware for handling file uploads
	jsonParserMiddleware, // Middleware for parsing JSON data
	requestCheckerMiddleware, // Middleware for checking parameters
	createThread,
);

// GET request for a specific Post by ID.
threadsRoutes.get("/thread/:id");

// DELETE request to delete a Post by ID.
threadsRoutes.delete(
	"/thread/:id",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware, // Middleware for checking parameters
);
