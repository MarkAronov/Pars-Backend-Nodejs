import ErrorAO from '../utils/ErrorAO.js';
import { fileTypeFromFile } from 'file-type';
import bcrypt from 'bcryptjs';
import _ from 'lodash';

import * as utils from '../utils/utils.js';
// import { fileTypeFromFile } from 'file-type';
import { IPost, Post } from '../models/postsModel.js';
import { IUser, User } from '../models/usersModel.js';
import {
  ParameterList,
  Request,
  allowedMediaTypesKeys,
} from 'src/utils/types.js';
import { Response } from 'express';

const requestMap: ParameterList = {
  POST: {
    '/users': {
      requiredParams: ['email', 'username', 'password'],
      optionalParams: [
        'displayName',
        'bio',
        'hideWhenMade',
        'hidePosts',
        'avatar',
        'backgroundImage',
      ],
    },
    '/users/login': {
      requiredParams: ['email', 'password'],
      optionalParams: [],
    },
    '/users/logout': { requiredParams: [], optionalParams: [] },
    '/users/logoutall': { requiredParams: [], optionalParams: [] },
    '/posts': {
      requiredParams: ['title'],
      optionalParams: [
        'content',
        'mentionedParents',
        'images',
        'videos',
        'datafiles',
      ],
    },
  },
  GET: {
    '/users': { requiredParams: [], optionalParams: ['requestedFields'] },
    '/users/self': { requiredParams: [], optionalParams: ['requestedFields'] },
    '/users/u/:username': {
      requiredParams: [],
      optionalParams: ['requestedFields'],
    },
    '/posts': { requiredParams: [], optionalParams: [] },
    '/posts/:id': { requiredParams: [], optionalParams: [] },
  },
  PATCH: {
    '/users/self/password': {
      requiredParams: ['currentPassword', 'newPassword'],
      optionalParams: [],
    },
    '/users/self/important': {
      requiredParams: ['password'],
      optionalParams: ['email', 'username'],
    },
    '/users/self/regular': {
      requiredParams: [],
      optionalParams: [
        'displayName',
        'bio',
        'hideWhenMade',
        'hidePosts',
        'avatar',
        'backgroundImage',
        'settings',
      ],
    },
    '/posts/:id': {
      requiredParams: [],
      optionalParams: [
        'title',
        'content',
        'mentionedParents',
        'filesToRemove',
        'images',
        'videos',
        'datafiles',
      ],
    },
  },
  DELETE: {
    '/users/self': { requiredParams: [], optionalParams: [] },
    '/users/self/partial': {
      requiredParams: ['requestedFields'],
      optionalParams: [],
    },
    '/posts/:id': { requiredParams: [], optionalParams: [] },
  },
};

const requestedUserGETFields = [
  'email',
  'username',
  'displayName',
  'bio',
  'hideWhenMade',
  'hidePosts',
  'avatar',
  'backgroundImage',
];

const requestedUserDELETEFields = ['bio', 'avatar', 'backgroundImage'];

const allowedFileTypes = {
  avatar: ['png', 'jpg', 'gif'],
  backgroundImage: ['png', 'jpg', 'gif'],
  images: ['png', 'jpg', 'gif'],
  videos: ['mp4', 'webm'],
  datafiles: ['pdf', 'zip'],
};

const allowedMediaTypes = [
  'avatar',
  'backgroundImage',
  'images',
  'videos',
  'datafiles',
];

const parameterChecker = utils.wrap(
  async (req: Request, res: Response, next: () => void) => {
    const reqKeys = [
      ...(req.body ? Object.keys(req.body) : []),
      ...(req.files ? Object.keys(req.files) : []),
    ];
    const reqMethod: string | undefined = req.method;
    const routePath: string | undefined = req.route?.path;

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
    const errorArray: {
      [key: string]: string[];
    } = {};

    const currentUser = req.user;
    let user, post;

    // Precursor, check if user is valid
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
    if (isPostRequest) {
      try {
        post = await Post.findById(req.params['id']);
      } catch (err) {
        throw new ErrorAO({ MAIN: ['Invalid Post ID'] }, 'ParameterError', 403);
      }
    }

    // First case, check for permissions
    if (isUserRequest && req.params['username']) {
      if (!user)
        throw new ErrorAO(
          {
            MAIN: [
              `There's no user with the username: ${req.params['username']}`,
            ],
          },
          'ParameterError',
          404,
        );
      if (
        currentUser &&
        !user._id.equals(currentUser._id) &&
        reqMethod !== 'GET'
      )
        throw new ErrorAO(
          { MAIN: ['You are not allowed to change/delete this user'] },
          'ParameterError',
          403,
        );
    }
    if (isPostRequest && req.params['id']) {
      if (!post)
        throw new ErrorAO(
          { MAIN: [`No post by that ID: ${req.params['id']}`] },
          'ParameterError',
          404,
        );
      if (
        currentUser &&
        !post.user._id.equals(currentUser._id) &&
        reqMethod !== 'GET'
      )
        throw new ErrorAO(
          { MAIN: ['You are not allowed to change/delete this post'] },
          'ParameterError',
          403,
        );
    }

    // Second case, check if there are unwanted parameters
    if (
      !reqKeys.every(
        (key: string) =>
          requiredParams.includes(key) || optionalParams.includes(key),
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
        { MAIN: ['Invalid request, got invalid parameters'] },
        'ParameterError',
      );
    }

    // Third case, check if there are missing parameters from the request
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

    // Fourth case, check if there are valid files from the request
    if (
      (dupeFlag =
        req.files !== undefined &&
        isPostRequest &&
        ((Object.keys(req.files).length > 1) as boolean))
    ) {
      errorArray['media'] = [
        'Either upload a set of images, a set of files or a single video',
      ];
    }

    // Fifth case, check if the patch request ins't violating any rules
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
          const filesToRemove = utils.filterDupes(
            req.body.filesToRemove.slice(),
          );
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

    // Sixth case, check if the files that were received are valid
    if (reqMethod === 'POST' || reqMethod === 'PATCH') {
      if (
        Object.keys(req.body).some((param) => allowedMediaTypes.includes(param))
      ) {
        if (isUserRequest)
          errorArray['media'] = [
            'Either upload an avatar or/and a background image.',
          ];
        if (isPostRequest)
          errorArray['media'] = [
            'Either upload a set of images, a set of files or a single video.',
          ];
      }
      if (req.files && Object.keys(req.files).length) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const mediaType = Object.keys(req.files)[0] as string;
        const mediaFiles = files[mediaType] as Express.Multer.File[];
        const allowedType = allowedFileTypes[
          mediaType as allowedMediaTypesKeys
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

export default parameterChecker;
