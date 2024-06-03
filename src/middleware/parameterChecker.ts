import { fileTypeFromFile } from 'file-type';
import _ from 'lodash';

import { Post } from '../models/postsModel.js';
import { User } from '../models/usersModel.js';
import { AllowedMediaTypesKeys, Request } from '../types/index.js';
import { Response } from 'express';
import {
  ErrorAO,
  requestMap,
  requestedUserGETFields,
  requestedUserDELETEFields,
  allowedFileTypes,
  allowedMediaTypes,
  wrap,
} from '../utils/index.js';

const getRouteConfig = (method: string, path: string) => {
  const methodRoutes = requestMap[method];
  if (!methodRoutes) {
    throw new ErrorAO(
      { MAIN: ['Unsupported request method'] },
      'RequestError',
      400,
    );
  }

  const routeConfig = methodRoutes[path];
  if (!routeConfig) {
    throw new ErrorAO({ MAIN: ['Unknown route path'] }, 'RequestError', 404);
  }

  return routeConfig;
};

const validateUserPermissions = async (req: Request) => {
  const { method, params, user: currentUser } = req;
  const isUserRequest = req.route?.path.includes('/users');

  if (isUserRequest && params['username']) {
    const user = await User.findOne({ username: params['username'] });
    if (!user) {
      throw new ErrorAO(
        { MAIN: [`No user with the username: ${params['username']}`] },
        'ParameterError',
        404,
      );
    }

    if (currentUser && !user._id.equals(currentUser._id) && method !== 'GET') {
      throw new ErrorAO(
        { MAIN: ['You are not allowed to change/delete this user'] },
        'ParameterError',
        403,
      );
    }
  }
};

const validatePostPermissions = async (req: Request) => {
  const { method, params, user: currentUser } = req;
  const isPostRequest = req.route?.path.includes('/posts');

  if (isPostRequest && params['id']) {
    const post = await Post.findById(params['id']);
    if (!post) {
      throw new ErrorAO(
        { MAIN: [`No post with ID: ${params['id']}`] },
        'ParameterError',
        404,
      );
    }

    if (
      currentUser &&
      !post.user._id.equals(currentUser._id) &&
      method !== 'GET'
    ) {
      throw new ErrorAO(
        { MAIN: ['You are not allowed to change/delete this post'] },
        'ParameterError',
        403,
      );
    }
  }
};

const validateParameters = (
  req: Request,
  requiredParams: string[],
  optionalParams: string[],
) => {
  const reqKeys = [
    ...(req.body ? Object.keys(req.body) : []),
    ...(req.files ? Object.keys(req.files) : []),
  ];

  if (
    !reqKeys.every(
      (key) => requiredParams.includes(key) || optionalParams.includes(key),
    ) ||
    (req.method === 'GET' &&
      req.body.requestedFields &&
      !req.body.requestedFields.every((key: string) =>
        requestedUserGETFields.includes(key),
      )) ||
    (req.method === 'DELETE' &&
      req.body.requestedFields &&
      !req.body.requestedFields.every((key: string) =>
        requestedUserDELETEFields.includes(key),
      ))
  ) {
    throw new ErrorAO(
      { MAIN: ['Invalid request, got invalid parameters'] },
      'ParameterError',
    );
  }

  if (!reqKeys.length && (requiredParams.length || optionalParams.length)) {
    throw new ErrorAO(
      {
        MAIN: [
          `Missing all required parameters${
            requiredParams.length ? ' (' + requiredParams.join(', ') + ')' : ''
          }.`,
        ],
      },
      'ParameterError',
    );
  }
};

const validateFiles = async (req: Request) => {
  const errorArray: { [key: string]: string[] } = {};
  const isPostRequest = req.route?.path.includes('/posts');
  const isUserRequest = req.route?.path.includes('/users');

  if (req.files && Object.keys(req.files).length) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const mediaType = Object.keys(req.files)[0] as string;
    const mediaFiles = files[mediaType];
    const allowedType = allowedFileTypes[mediaType as AllowedMediaTypesKeys];

    if (mediaFiles) {
      for (const file of mediaFiles) {
        const meta = await fileTypeFromFile(file.path);
        if (!allowedType.includes(meta?.ext as string)) {
          errorArray['media'] = [
            `${mediaType} must only have files with the following formats: ${allowedType.join(
              ', ',
            )}.`,
          ];
          break;
        }
      }
    }

    if (Object.keys(errorArray).length) {
      throw new ErrorAO(errorArray, 'ParameterError');
    }
  }

  if (
    (isUserRequest || isPostRequest) &&
    Object.keys(req.body).some((param) => allowedMediaTypes.includes(param))
  ) {
    if (isUserRequest) {
      throw new ErrorAO(
        { media: ['Either upload an avatar or/and a background image.'] },
        'ParameterError',
      );
    }
    if (isPostRequest) {
      throw new ErrorAO(
        {
          media: [
            'Either upload a set of images, a set of files or a single video.',
          ],
        },
        'ParameterError',
      );
    }
  }
};

const parameterChecker = wrap(
  async (req: Request, res: Response, next: () => void) => {
    const routePath = req.route?.path;
    const method = req.method;

    if (!method || !routePath) {
      throw new ErrorAO({ MAIN: ['Malformed request'] }, 'RequestError', 500);
    }

    const { requiredParams, optionalParams } = getRouteConfig(
      method,
      routePath,
    );

    await validateUserPermissions(req);
    await validatePostPermissions(req);
    validateParameters(req, requiredParams, optionalParams);
    await validateFiles(req);

    next();
  },
);

export default parameterChecker;
