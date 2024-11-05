import type { Request as expressRequest } from "express";
import type { RouteConfig } from "./generalTypes";
import type { UserType } from "./userTypes";

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
