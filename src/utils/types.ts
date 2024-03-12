import { Request as expressRequest } from 'express';
import { IUserModel } from 'src/models/usersModel';

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
  user?: IUserModel;
  token?: string;
}
