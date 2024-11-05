// Import necessary modules and dependencies
import express from "express";

import { createTopic } from "../controllers";
import {
	TopicMulter,
	authMiddleware,
	jsonParserMiddleware,
	requestCheckerMiddleware,
} from "../middleware";

// Create a new express router
export const topicsRoutes = express.Router();

/// POST ROUTES ///

// POST request for creating a new Post.
topicsRoutes.post(
	"/topic",
	authMiddleware, // Middleware for authentication
	TopicMulter, // Middleware for handling file uploads
	jsonParserMiddleware, // Middleware for parsing JSON data
	requestCheckerMiddleware, // Middleware for checking parameters
	createTopic,
);

// GET request for a specific Post by ID.
topicsRoutes.get("/topic/:id");

// DELETE request to delete a Post by ID.
topicsRoutes.delete(
	"/topic/:id",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware, // Middleware for checking parameters
);
