import ErrorAO from '../utils/ErrorAO.js';
import bcrypt from 'bcryptjs';
import _ from 'lodash';

import * as utils from '../utils/utils.js';
// import { fileTypeFromFile } from 'file-type';
import { Post } from '../models/postsModel.js';
import { User } from '../models/usersModel.js';

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
        'mainPost',
        'mentionedParents',
        'images',
        'videos',
        'datafiles',
      ],
    },
  },
  GET: {
    '/users': { requiredParams: [], optionalParams: [] },
    '/users/:username': { requiredParams: [], optionalParams: [] },
    '/posts/:id': { requiredParams: [], optionalParams: [] },
  },
  PATCH: {
    '/users/me/password': {
      requiredParams: ['currentPassword', 'newPassword'],
      optionalParams: [],
    },
    '/users/me/important': {
      requiredParams: ['password'],
      optionalParams: ['email', 'username'],
    },
    '/users/me/regular': {
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
        'mainPost',
        'mentionedParents',
        'filesToRemove',
        'images',
        'videos',
        'datafiles',
      ],
    },
  },
  DELETE: {
    '/users/me': { requiredParams: [], optionalParams: [] },
    '/posts/:id': { requiredParams: [], optionalParams: [] },
  },
};

// const whiteListedFileTypes = {
//   avatar: ['png', 'jpg', 'gif'],
//   backgroundImage: ['png', 'jpg', 'gif'],
//   images: ['png', 'jpg', 'gif'],
//   videos: ['mp4', 'webm'],
//   datafiles: ['pdf', 'zip'],
// };

// const allowedMediaTypes = {
//   '/users': ['avatar', 'backgroundImage'],
//   '/posts': ['images', 'videos', 'datafiles'],
// };

// const mediaTypesErrorString = {
//   '/users': 'Either upload an avatar or/and a background image',
//   '/posts': 'Either upload a set of images, a set of files or a single video',
// };

const parameterChecker = utils.wrap(
  async (req: any, res: any, next: () => void) => {
    let reqKeys = req.body ? Object.keys(req.body) : [];
    reqKeys = req.files ? reqKeys.concat(Object.keys(req.files)) : reqKeys;

    const requiredParams =
      requestMap[req.method][req.route.path]?.requiredParams;
    const optionalParams =
      requestMap[req.method][req.route.path]?.optionalParams;

    const parameterFreeRequest =
      !requiredParams.length && !optionalParams.length;

    const isPatchMethod = req.method === 'PATCH';
    const isPostRequest = req.route.path.indexOf('/posts') >= 0;
    const isUserRequest = req.route.path.indexOf('/users') >= 0;

    let dupeFlag = false;
    const errorArray: {
      [key: string]: string[];
    } = {};

    const currentUser = req.user;
    let user, post;
    try {
      user = await User.findById(req.params.username);
    } catch (err) {
      throw new ErrorAO({ MAIN: ['Invalid username'] }, 'ParameterError', 403);
    }
    try {
      post = await Post.findById(req.params.id);
      if (reqKeys.includes('mainPost')) {
        await Post.findById(req.params.id);
      }
      if (reqKeys.includes('mentionedParents')) {
        for (let i = 0; i < req.body.mentionedParents.length; i++) {
          await Post.findById(req.body.mentionedParents[i]);
        }
      }
    } catch (err) {
      throw new ErrorAO({ MAIN: ['Invalid post id'] }, 'ParameterError', 403);
    }

    // First case, check for permissions
    if (isUserRequest && req.params.username) {
      if (!user)
        throw new ErrorAO(
          {
            MAIN: [`There's no user with the username: ${req.params.username}`],
          },
          'ParameterError',
          404
        );
      if (!user._id.equals(currentUser._id))
        throw new ErrorAO(
          { MAIN: ['You are not allowed to change/delete this user'] },
          'ParameterError',
          403
        );
    }
    if (isPostRequest && req.params.id) {
      if (!post)
        throw new ErrorAO(
          { MAIN: [`No post by that ID: ${req.params.id}`] },
          'ParameterError',
          404
        );
      if (!post.user._id.equals(currentUser._id))
        throw new ErrorAO(
          { MAIN: ['You are not allowed to change/delete this post'] },
          'ParameterError',
          403
        );
    }

    // Second case, check if there are unwanted parameters
    if (
      !reqKeys.every((key: string) => {
        return requiredParams.includes(key) || optionalParams.includes(key);
      })
    ) {
      throw new ErrorAO(
        { MAIN: ['Invalid request, got invalid parameters'] },
        'ParameterError'
      );
    }

    // Third case, check if there are missing parameters from the request
    if (!reqKeys.length && !parameterFreeRequest) {
      throw new ErrorAO({ MAIN: ['Missing parameters'] }, 'ParameterError');
    }
    if (
      optionalParams.length &&
      optionalParams.every((key) => !reqKeys.includes(key)) &&
      isPatchMethod
    ) {
      errorArray.MAIN = [
        `Missing one of the following parameters: ${optionalParams.join(', ')}`,
      ];
    }
    for (let i = 0; i < requiredParams.length; i++) {
      const key: string = requiredParams[i];
      const errorKey = key.charAt(0).toUpperCase() + key.slice(1);
      if (!reqKeys.includes(key)) {
        errorArray[key] = [`${errorKey} is missing and it's needed`];
      }
    }

    if (
      (dupeFlag =
        req.files && isPostRequest && Object.keys(req.files).length > 1)
    ) {
      errorArray.media = [
        'Either upload a set of images, a set of files or a single video',
      ];
    }

    if (isPatchMethod) {
      for (let i = 0; i < reqKeys.length; i++) {
        const key: string = reqKeys[i];
        const errorKey = key.charAt(0).toUpperCase() + key.slice(1);

        if (
          key === 'filesToRemove' &&
          isPostRequest &&
          Object.keys(req.files).length
        ) {
          const filesToRemove = utils.filterDupes(
            req.body.filesToRemove.slice()
          );
          const mediaType = Object.keys(req.files)[0];

          if (
            !dupeFlag &&
            !post.media.every((file) => {
              return filesToRemove.includes(file);
            }) &&
            mediaType !== post.mediaType
          ) {
            const errMsg = `You can't have multiple media types in the same post`;
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

    if (Object.keys(errorArray).length) {
      throw new ErrorAO(errorArray, 'ParameterError');
    }
    next();
  }
);

export default parameterChecker;
