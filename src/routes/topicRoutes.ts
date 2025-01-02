// Import necessary modules and dependencies
import express from "express";

import { createTopic, deleteTopic, getTopic, getTopics } from "@/controllers";
import { authMiddleware, requestCheckerMiddleware } from "@/middleware";

// Create a new express router
export const topicsRoutes = express.Router();

/// TOPIC ROUTES ///

// POST request for creating a new Topic.
topicsRoutes.post(
	"/topic",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: ["name", "description"],
		optionalParams: ["cover"],
	}), // Middleware for checking parameters
	createTopic,
);

// GET request for all Topics.
topicsRoutes.get(
	"/topics",
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}), // Middleware for checking parameters
	getTopics,
);

// GET request for a specific Topic by name.
topicsRoutes.get(
	"/topic/:name",
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}), // Middleware for checking parameters
	getTopic,
);

// DELETE request to delete a Topic by name.
topicsRoutes.delete(
	"/topic/:name",
	authMiddleware, // Middleware for authentication
	requestCheckerMiddleware({
		requiredParams: [],
		optionalParams: [],
	}), // Middleware for checking parameters
	deleteTopic,
);
