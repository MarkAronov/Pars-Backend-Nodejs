import { fileTypeFromFile } from 'file-type';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
import { Post } from '../models/postsModel.js';
import { User } from '../models/usersModel.js';
import {
  AllowedMediaTypesKeys,
  IPost,
  IUser,
  Request,
} from '../types/index.js';
import { Response, NextFunction } from 'express';
import {
  requestMap,
  requestedUserGETFields,
  requestedUserDELETEFields,
  allowedFileTypes,
  allowedMediaTypes,
  ErrorAO,
  filterDupes,
  wrap,
} from '../utils/index.js';

/**
 * Middleware to check the parameters and files in the request.
 * Ensures that the required parameters are present, unwanted parameters are not included,
 * the parameters are valid, and the files are of allowed types.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const requestCheckerMiddleware = wrap(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response, next: NextFunction) => {
    const reqKeys = [
      ...(req.body ? Object.keys(req.body) : []),
      ...(req.files ? Object.keys(req.files) : []),
    ];
    const reqMethod: string | undefined = req.method;
    const routePath: string | undefined = req.route?.path;

    // Validate request method and route path
    if (!reqMethod || !routePath) {
      throw new ErrorAO({ MAIN: ['Malformed request'] }, 'RequestError', 500);
    }

    const methodRoutes = requestMap[reqMethod];
    if (!methodRoutes) {
      throw new ErrorAO(
        { MAIN: ['Unsupported request method'] },
        'RequestError',
        400,
      );
    }

    const routeConfig = methodRoutes[routePath];
    if (!routeConfig) {
      throw new ErrorAO({ MAIN: ['Unknown route path'] }, 'RequestError', 404);
    }

    const { requiredParams, optionalParams } = routeConfig;
    const parameterFreeRequest =
      (!requiredParams.length && !optionalParams.length) || reqMethod === 'GET';

    const isPostRequest = routePath.indexOf('/posts') >= 0;
    const isUserRequest = routePath.indexOf('/users') >= 0;

    let dupeFlag = false;
    const errorArray: { [key: string]: string[] } = {};

    const currentUser = req.user;
    let user, post;

    // Validate user for user-related requests
    if (isUserRequest) {
      try {
        user = await User.findOne({ username: req.params['username'] });
      } catch (err) {
        throw new ErrorAO(
          { MAIN: ['Invalid Username'] },
          'ParameterError',
          403,
        );
      }
    }

    // Validate post for post-related requests
    if (isPostRequest) {
      try {
        post = await Post.findById(req.params['id']);
      } catch (err) {
        throw new ErrorAO({ MAIN: ['Invalid Post ID'] }, 'ParameterError', 403);
      }
    }

    // Check permissions for user-related requests
    if (isUserRequest && req.params['username']) {
      if (!user) {
        throw new ErrorAO(
          {
            MAIN: [
              `There's no user with the username: ${req.params['username']}`,
            ],
          },
          'ParameterError',
          404,
        );
      }
      if (
        currentUser &&
        !user._id.equals(currentUser._id) &&
        reqMethod !== 'GET'
      ) {
        throw new ErrorAO(
          {
            MAIN: ['You are not allowed to change/delete this user'],
          },
          'ParameterError',
          403,
        );
      }
    }

    // Check permissions for post-related requests
    if (isPostRequest && req.params['id']) {
      if (!post) {
        throw new ErrorAO(
          {
            MAIN: [`No post by that ID: ${req.params['id']}`],
          },
          'ParameterError',
          404,
        );
      }
      if (
        currentUser &&
        !post.user._id.equals(currentUser._id) &&
        reqMethod !== 'GET'
      ) {
        throw new ErrorAO(
          {
            MAIN: ['You are not allowed to change/delete this post'],
          },
          'ParameterError',
          403,
        );
      }
    }

    // Check for unwanted parameters
    if (
      !reqKeys.every(
        (key) => requiredParams.includes(key) || optionalParams.includes(key),
      ) ||
      (reqMethod === 'GET' &&
        req.body.requestedFields &&
        !req.body.requestedFields.every((key: string) =>
          requestedUserGETFields.includes(key),
        )) ||
      (reqMethod === 'DELETE' &&
        req.body.requestedFields &&
        !req.body.requestedFields.every((key: string) =>
          requestedUserDELETEFields.includes(key),
        ))
    ) {
      throw new ErrorAO(
        {
          MAIN: ['Invalid request, got invalid parameters'],
        },
        'ParameterError',
      );
    }

    // Check for missing parameters
    if (!reqKeys.length && !parameterFreeRequest) {
      throw new ErrorAO(
        {
          MAIN: [
            `Missing all required parameters${
              requiredParams.length
                ? ' (' + requiredParams.join(', ') + ')'
                : ''
            }.`,
          ],
        },
        'ParameterError',
      );
    }

    if (
      optionalParams.length &&
      optionalParams.every((key) => !reqKeys.includes(key)) &&
      reqMethod === 'PATCH'
    ) {
      errorArray['MAIN'] = [
        `Missing one of the following optional parameters: ${optionalParams.join(
          ', ',
        )}`,
      ];
    }

    for (const reqParam of requiredParams) {
      if (!reqKeys.includes(reqParam)) {
        errorArray[reqParam] = [`${reqParam} is missing and it's needed`];
      }
    }

    // Check for duplicate files in the request
    if (
      req.files !== undefined &&
      isPostRequest &&
      ((Object.keys(req.files).length > 1) as boolean)
    ) {
      dupeFlag = true;
      errorArray['media'] = [
        'Either upload a set of images, a set of files or a single video',
      ];
    }

    // Validate patch requests
    if (reqMethod === 'PATCH') {
      for (const reqKey of reqKeys) {
        const errorKey: string = (reqKey.charAt(0).toUpperCase() +
          reqKey.slice(1)) as string;

        if (
          reqKey === 'filesToRemove' &&
          isPostRequest &&
          req.files !== undefined &&
          Object.keys(req.files).length
        ) {
          const filesToRemove = filterDupes(req.body.filesToRemove.slice());
          const mediaType = Object.keys(req.files)[0];

          if (
            !dupeFlag &&
            !post?.media.every((file) => filesToRemove.includes(file)) &&
            mediaType !== post?.mediaType
          ) {
            const errMsg =
              "You can't have multiple media types in the same post";
            errorArray['media'] = errorArray['media']
              ? errorArray['media'].concat([errMsg])
              : [errMsg];
          }
        }

        if (currentUser !== undefined && reqKey === 'newPassword') {
          const formerPasses = currentUser.formerPasswords;
          if (formerPasses) {
            for (const formerPass of formerPasses) {
              if (await bcrypt.compare(req.body[reqKey], formerPass)) {
                errorArray['password'] = [
                  'Password was formally used, use another.',
                ];
              }
            }
          }
        }

        if (
          (currentUser &&
            isUserRequest &&
            _.isEqual(
              currentUser[reqKey as keyof IUser] ?? '',
              req.body[reqKey],
            )) ||
          (post &&
            isPostRequest &&
            _.isEqual(post[reqKey as keyof IPost] ?? '', req.body[reqKey]))
        ) {
          errorArray[reqKey] = [
            `${errorKey} has the same value as what's currently stored, try another.`,
          ];
        }
      }
    }

    // Validate uploaded files
    if (reqMethod === 'POST' || reqMethod === 'PATCH') {
      if (
        Object.keys(req.body).some((param) => allowedMediaTypes.includes(param))
      ) {
        if (isUserRequest) {
          errorArray['media'] = [
            'Either upload an avatar or/and a background image.',
          ];
        }
        if (isPostRequest) {
          errorArray['media'] = [
            'Either upload a set of images, a set of files or a single video.',
          ];
        }
      }

      if (req.files && Object.keys(req.files).length) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const mediaType = Object.keys(req.files)[0] as string;
        const mediaFiles = files[mediaType] as Express.Multer.File[];
        const allowedType = allowedFileTypes[
          mediaType as AllowedMediaTypesKeys
        ] as string[];
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
    }

    if (Object.keys(errorArray).length) {
      throw new ErrorAO(errorArray, 'ParameterError');
    }
    next();
  },
);
