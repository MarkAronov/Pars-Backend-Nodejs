import ErrorAO from '../utils/ErrorAO.js';
import { fileTypeFromFile } from 'file-type';
import bcrypt from 'bcryptjs';
import _ from 'lodash';

import * as utils from '../utils/utils.js';
// import { fileTypeFromFile } from 'file-type';
import { Post } from '../models/postsModel.js';
import { User } from '../models/usersModel.js';
import { Request } from 'src/utils/types.js';
import { Response } from 'express';

const requestMap = {
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
    let reqKeys = req.body ? Object.keys(req.body) : [];
    reqKeys = req.files ? reqKeys.concat(Object.keys(req.files)) : reqKeys;

    const requiredParams =
      requestMap[req.method][req.route.path]?.requiredParams;
    const optionalParams =
      requestMap[req.method][req.route.path]?.optionalParams;

    const parameterFreeRequest =
      (!requiredParams.length && !optionalParams.length) ||
      req.method === 'GET';

    const isPostRequest = req.route.path.indexOf('/posts') >= 0;
    const isUserRequest = req.route.path.indexOf('/users') >= 0;

    let dupeFlag = false;
    const errorArray: {
      [key: string]: string[];
    } = {};

    const currentUser = req.user;
    let user, post;

    // Precursor, check if user is valid
    if (isUserRequest) {
      try {
        user = await User.findOne({ username: req.params.username });
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
        post = await Post.findById(req.params.id);
      } catch (err) {
        throw new ErrorAO({ MAIN: ['Invalid Post ID'] }, 'ParameterError', 403);
      }
    }

    // First case, check for permissions
    if (isUserRequest && req.params.username) {
      if (!user)
        throw new ErrorAO(
          {
            MAIN: [`There's no user with the username: ${req.params.username}`],
          },
          'ParameterError',
          404,
        );
      if (!user._id.equals(currentUser._id) && req.method !== 'GET')
        throw new ErrorAO(
          { MAIN: ['You are not allowed to change/delete this user'] },
          'ParameterError',
          403,
        );
    }
    if (isPostRequest && req.params.id) {
      if (!post)
        throw new ErrorAO(
          { MAIN: [`No post by that ID: ${req.params.id}`] },
          'ParameterError',
          404,
        );
      if (!post.user._id.equals(currentUser._id) && req.method !== 'GET')
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
      req.method === 'PATCH'
    ) {
      errorArray.MAIN = [
        `Missing one of the following optional parameters: ${optionalParams.join(
          ', ',
        )}`,
      ];
    }
    for (let i = 0; i < requiredParams.length; i++) {
      const key: string = requiredParams[i];
      const errorKey = key.charAt(0).toUpperCase() + key.slice(1);
      if (!reqKeys.includes(key)) {
        errorArray[key] = [`${errorKey} is missing and it's needed`];
      }
    }

    // Fourth case, check if there are valid files from the request
    if (
      (dupeFlag =
        req.files && isPostRequest && Object.keys(req.files).length > 1)
    ) {
      errorArray.media = [
        'Either upload a set of images, a set of files or a single video',
      ];
    }

    // Fifth case, check if the patch request ins't violating any rules
    if (req.method === 'PATCH') {
      for (let i = 0; i < reqKeys.length; i++) {
        const key: string = reqKeys[i];
        const errorKey = key.charAt(0).toUpperCase() + key.slice(1);

        if (
          key === 'filesToRemove' &&
          isPostRequest &&
          Object.keys(req.files).length
        ) {
          const filesToRemove = utils.filterDupes(
            req.body.filesToRemove.slice(),
          );
          const mediaType = Object.keys(req.files)[0];

          if (
            !dupeFlag &&
            !post.media.every((file) => filesToRemove.includes(file)) &&
            mediaType !== post.mediaType
          ) {
            const errMsg =
              "You can't have multiple media types in the same post";
            errorArray.media = errorArray.media
              ? errorArray.media.concat([errMsg])
              : [errMsg];
          }
        }

        if (key === 'newPassword') {
          for (let j = 0; j < currentUser.formerPasswords.length; j++) {
            const keyPass = currentUser.formerPasswords[j];
            if (await bcrypt.compare(req.body[key], keyPass)) {
              errorArray.password = [
                'Password was formally used, use another.',
              ];
            }
          }
        }

        if (
          (isUserRequest && _.isEqual(currentUser[key] ?? '', req.body[key])) ||
          (isPostRequest && _.isEqual(post[key] ?? '', req.body[key]))
        ) {
          errorArray[key] = [
            `${errorKey} has the same value as what's currently stored, try another.`,
          ];
        }
      }
    }

    // Sixth case, check if the files that were received are valid
    if (req.method === 'POST' || req.method === 'PATCH') {
      if (
        Object.keys(req.body).some((param) => allowedMediaTypes.includes(param))
      ) {
        if (isUserRequest)
          errorArray.media = [
            'Either upload an avatar or/and a background image.',
          ];
        if (isPostRequest)
          errorArray.media = [
            'Either upload a set of images, a set of files or a single video.',
          ];
      }
      if (req.files && Object.keys(req.files).length) {
        const mediaType = Object.keys(req.files)[0];

        for (let i = 0; i < req.files[mediaType].length; i++) {
          const meta = await fileTypeFromFile(req.files[mediaType][i].path);
          if (!allowedFileTypes[mediaType].includes(meta.ext)) {
            errorArray.media = [
              `${mediaType} must only have files with the following formats: ${allowedFileTypes[
                mediaType
              ].join(', ')}.`,
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
