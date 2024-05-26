import { Request as expressRequest } from 'express';
import { HydratedDocument } from 'mongoose';
import { IPost, IPostMethods, IPostVirtuals } from 'src/models/postsModel';
import { IUser, IUserMethods, IUserVirtuals } from 'src/models/usersModel';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteConfig {
  requiredParams: string[];
  optionalParams: string[];
  isParameterFree: boolean;
}

export type ParameterList = {
  [index: string]: {
    [index: string]: { requiredParams: string[]; optionalParams: string[] };
  };
};

export type UserType = HydratedDocument<IUser, IUserMethods & IUserVirtuals>;
export type PostType = HydratedDocument<IPost, IPostMethods & IPostVirtuals>;

export type UserMediaTypeKeys = 'avatar' | 'backgroundImage';
export type UserPartialDeleteTypeKeys = 'bio' | 'avatar' | 'backgroundImage';
export type UserRegularPatchTypeKeys =
  | 'displayName'
  | 'bio'
  | 'avatar'
  | 'backgroundImage'
  | 'settings';
export type UserOptionalTypeKeys = 'bio';
export type allowedMediaTypesKeys =
  | 'avatar'
  | 'backgroundImage'
  | 'images'
  | 'videos'
  | 'datafiles';

export interface RequestMapConfig {
  [method: string]: {
    [route: string]: RouteConfig;
  };
}

export interface Request extends expressRequest {
  user?: UserType;
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
