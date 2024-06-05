import { ParameterList } from '../types/index.js';

// Helper function to create parameter configuration
const createParams = (required: string[], optional: string[] = []) => ({
  requiredParams: required,
  optionalParams: optional,
});

const userParams = [
  'displayName',
  'bio',
  'hideWhenMade',
  'hidePosts',
  'avatar',
  'backgroundImage',
];

const postParams = [
  'title',
  'content',
  'mentionedParents',
  'images',
  'videos',
  'datafiles',
];

export const requestMap: ParameterList = {
  POST: {
    '/users': createParams(['email', 'username', 'password'], userParams),
    '/users/login': createParams(['email', 'password']),
    '/users/logout': createParams([]),
    '/users/logoutall': createParams([]),
    '/posts': createParams(['title'], postParams),
    '/thread': createParams(['title'], postParams),
  },
  GET: {
    '/users': createParams([], ['requestedFields']),
    '/users/self': createParams([], ['requestedFields']),
    '/users/u/:username': createParams([], ['requestedFields']),
    '/posts': createParams([]),
    '/posts/:id': createParams([]),
    '/thread/:id': createParams([]),
    '/topic/:name': createParams([]),
  },
  PATCH: {
    '/users/self/password': createParams(['currentPassword', 'newPassword']),
    '/users/self/important': createParams(['password'], ['email', 'username']),
    '/users/self/regular': createParams([], [...userParams, 'settings']),
    '/posts/:id': createParams([], [...postParams, 'filesToRemove']),
  },
  DELETE: {
    '/users/self': createParams([]),
    '/users/self/partial': createParams(['requestedFields']),
    '/posts/:id': createParams([]),
    '/thread/:id': createParams([]),
    '/topic/:name': createParams([]),
  },
};

export const requestedUserGETFields = [
  'email',
  'username',
  'displayName',
  'bio',
  'hideWhenMade',
  'hidePosts',
  'avatar',
  'backgroundImage',
];

export const requestedUserDELETEFields = ['bio', 'avatar', 'backgroundImage'];

export const allowedFileTypes = {
  avatar: ['png', 'jpg', 'gif'],
  backgroundImage: ['png', 'jpg', 'gif'],
  images: ['png', 'jpg', 'gif'],
  videos: ['mp4', 'webm'],
  datafiles: ['pdf', 'zip'],
};

export const allowedMediaTypes = [
  'avatar',
  'backgroundImage',
  'images',
  'videos',
  'datafiles',
];
