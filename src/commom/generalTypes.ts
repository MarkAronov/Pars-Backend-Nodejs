import type { Request as expressRequest } from "express";
import type { PostType } from "src/api/post/post.types";
import type { ThreadType } from "src/api/thread/thread.types";
import type { TopicType } from "src/api/topic/topic.types";
import type { UserType } from "src/api/user/user.types";

// Interface for Route Configuration
export interface RouteConfig {
	requiredParams: string[];
	optionalParams: string[];
	isParameterFree: boolean;
}
export interface ValidationError extends Error {
	errors: {
		[key: string]: {
			properties: {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				[x: string]: any;
				reason?: {
					errorAO: string[];
					errorArray: string[];
				};
				message: string;
				type?: string;
			};
			kind?: string;
		};
	};
}

// Extended Express Request Interface
export interface Request extends expressRequest {
	user?: UserType;
	post?: PostType;
	thread?: ThreadType;
	topic?: TopicType;
	token?: string;
	errorList?: { [key: string]: string[] };
}
