import { Request as expressRequest } from 'express';
import { User } from 'src/models/usersModel';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteConfig {
  requiredParams: string[];
  optionalParams: string[];
  isParameterFree: boolean;
}

export interface RequestMapConfig {
  [method: string]: {
    [route: string]: RouteConfig;
  };
}

export interface Request extends expressRequest {
  user?: typeof User;
  token?: string;
}

export interface Token {
  token: string;
  _id: string;
  id: string;
}

export interface Tokens {
  tokens: Token[];
}
