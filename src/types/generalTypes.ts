import type { Request as expressRequest } from "express";
import type { UserType } from "./userTypes";

// Interface for Route Configuration
export interface RouteConfig {
	requiredParams: string[];
	optionalParams: string[];
	isParameterFree: boolean;
}

// Interface for Parameter List
export type ParameterList = {
	[index: string]: {
		[index: string]: {
			requiredParams: string[];
			optionalParams: string[];
		};
	};
};

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
	token?: string;
}

// Request Map Configuration
export interface RequestMapConfig {
	[method: string]: {
		[route: string]: RouteConfig;
	};
}

// General Types
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Token Interface
export interface Token {
	token: string;
	_id: string;
	id: string;
}

// Tokens Interface
export interface Tokens {
	tokens: Token[];
}
