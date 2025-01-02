import type { PostType, ThreadType, TopicType, UserType } from "@/types";
import type { Request as expressRequest } from "express";

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
