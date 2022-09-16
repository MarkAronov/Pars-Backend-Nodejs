import ErrorAO from '../utils/ErrorAO.js';
import bcrypt from 'bcryptjs';

import { fileTypeFromFile } from 'file-type';
import { Post } from '../models/postsModel.js';

const requestMap = {
  GET: { '/posts/:id': { requiredParams: [], optionalParams: [] } },
  POST: {
    '/posts': {
      requiredParams: ['title'],
      optionalParams: ['content', 'mainPost', 'mentionedParents'],
    },
    '/users': {
      requiredParams: ['email', 'username', 'password'],
      optionalParams: ['displayName', 'avatar', 'backgroundImage'],
    },
    '/users/login': {
      requiredParams: ['email', 'password'],
      optionalParams: [],
    },
  },
  DELETE: { '/posts/:id': { requiredParams: [], optionalParams: [] } },
  PATCH: {
    '/posts/:id': {
      requiredParams: [],
      optionalParams: [
        'title',
        'content',
        'mainPost',
        'mentionedParents',
        'filesToRemove',
        'avatar',
        'backgroundImage',
      ],
    },
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
      optionalParams: ['displayName', 'bio', 'hideWhenMade', 'hidePosts'],
    },
  },
};

const whiteListedFileTypes = {
  images: ['png', 'jpg', 'gif'],
  videos: ['mp4', 'webm'],
  datafiles: ['pdf', 'zip'],
};

const urlsThatUploadFiles = [
  '/posts',
  '/users/me/:mediatype',
  '/posts/:id',
  '/users/me',
];

const allowedMediaTypes = {
  '/users/': [
    ['avatar', 'backgroundImage'],
    'Either upload an avatar or a background image',
  ],
  '/posts/': [
    ['images', 'videos', 'datafiles'],
    'Either upload a set of images, a set of files or a single video',
  ],
};

const parameterChecker = async (req: any, res: any, next: () => void) => {
  const reqKeys = Object.keys(req.body);
  const requiredParams = requestMap[req.method][req.route.path].requiredParams;
  const optionalParams = requestMap[req.method][req.route.path].optionalParams;

  const parameterFreeRequest = !requiredParams.length && !optionalParams.length;
  const needOneOptionalParam = req.method === 'PATCH';
  const isPostRequest = req.route.path.indexOf('/posts/') >= 0;
  const isUserRequest = req.route.path.indexOf('/users/') >= 0;

  // First case,
  if (isPostRequest) {
    const post = await Post.findById(req.params.id);
    if (!post)
      throw new ErrorAO(
        { MAIN: [`No post by that ID: ${req.params.id}`] },
        'ParameterError',
        404
      );
    if (!post.user._id.equals(req.user._id))
      throw new ErrorAO(
        { MAIN: ['You are not allowed to change/delete this post'] },
        'ParameterError',
        403
      );
  }

  // Second case, check if there are missing parameters from the request
  if (reqKeys.length === 0 && !parameterFreeRequest) {
    throw new ErrorAO({ MAIN: ['Missing parameters'] }, 'ParameterError');
  }

  // Third case, check if there are unwanted parameters
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

  const errorArray: {
    [key: string]: string[];
  } = {};
  if (
    optionalParams.length !== 0 &&
    optionalParams.every((key) => !reqKeys.includes(key)) &&
    needOneOptionalParam
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
    if (req.route.path === '') {
      if (key === 'newPassword') {
        for (let j = 0; j < req.user.formerPasswords.length; j++) {
          const keyPass = req.user.formerPasswords[j];
          if (await bcrypt.compare(req.body[key], keyPass)) {
            errorArray.password = ['Password was formally used, use another.'];
          }
        }
      }
      if (req.user[key] === req.body[key]) {
        errorArray[key] = [`${errorKey} is being currently used, try another.`];
      }
    }
  }
  if (Object.keys(errorArray).length) {
    throw new ErrorAO(errorArray, 'ParameterError');
  }

  next();
};

export const fileChecker = async (
  req: any,
  allowedTypes: any,
  post: any = null
) => {
  const mediaType = Object.keys(req.files)[0];
  const files = req.files[mediaType];

  if (Object.keys(req.files).length > 1) {
    throw new ErrorAO(
      {
        MAIN: ['You can not send multiple types in the same post'],
      },
      'ParameterError'
    );
  }

  if (
    allowedTypes.every((key) => !mediaType.includes(key)) ||
    (post.mediaType !== mediaType &&
      files.length - req.body?.filesToRemove.length !== 0)
  ) {
    throw new ErrorAO(
      {
        MAIN: [
          'Either upload a set of images, a set of files or a single video',
        ],
      },
      'ParameterError'
    );
  }

  for (let i = 0; i < files.length; i++) {
    const meta = await fileTypeFromFile(files[i].path);
    if (!meta || !whiteListedFileTypes[mediaType].includes(meta.ext)) {
      throw new ErrorAO(
        {
          MAIN: [
            `The only formats allowed are: ${whiteListedFileTypes[
              mediaType
            ].join(', ')}`,
          ],
        },
        'ParameterError'
      );
    }
  }
};

export default parameterChecker;
