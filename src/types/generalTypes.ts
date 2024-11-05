import type { RequestHandler } from "express";

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

export interface ValidationError {
	errors: {
		[key: string]: {
			properties: {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				[x: string]: any;
				reason?: {
					errorAO: string[]; errorArray: string[] 
};
				message: string;
				type?: string;
			};
			kind?: string;
		};
	};
}
