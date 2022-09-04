import { Request } from 'express';
import validator from 'validator';
import ErrorAO from './ErrorAO.js';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { fileTypeFromFile } from 'file-type';
import { Post } from '../models/postsModel.js';
// FUNCTIONS

export const dirName = () => {
  return dirname(fileURLToPath(import.meta.url));
};

/**
 * Normalize a port into a number, string, or false.
 * @param {string} val
 * @return {any}
 */
export const normalizePort = (val: string): any => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
};

export const filterDupes = (arr: string[] = []) => {
  const map = new Map();
  let filtered: string[] = [];
  for (const a of arr) {
    if (!map.get(a)) {
      map.set(a, true);
      filtered = filtered.concat(a);
    }
  }
  return filtered;
};

export const usernameChecker = (str: string = ''): string[] => {
  const nameErrors = [];

  if (validator.contains(str, ' '))
    nameErrors.push('Username contains whitespace');
  if (!str.match(/^[0-9a-zA-Z\s]+$/))
    nameErrors.push('Username contains none alphanumeric characters');
  return nameErrors;
};

export const emailChecker = (str: string = ''): string[] => {
  const emailErrors = [];

  if (!validator.isEmail(str)) emailErrors.push('Invalid email');
  return emailErrors;
};

export const passwordChecker = (str: string = ''): string[] => {
  const passwordErrors = [];
  const lowercase = str.match(/[a-z]/);
  const uppercase = str.match(/[A-Z]/);
  const numbers = str.match(/[0-9]/);

  // Minimum: 10 chars | 1 Uppercase | 1 lowercase | 1 digit
  if (str.length < 10)
    passwordErrors.push('Password is less than 10 characters');
  if (!lowercase)
    passwordErrors.push('Password must have at least one lowercase');
  if (!uppercase)
    passwordErrors.push('Password must have at least one uppercase');
  if (!numbers) passwordErrors.push('Password must have at least one digit');

  return passwordErrors;
};

export const entropy = (str: string): number => {
  // Password entropy
  const E: number = str.length * Math.log2(filterDupes(str.split('')).length);

  return E;
};

export const validationErrorComposer = (error: any) => {
  const errorArray: { [key: string]: string[] } = {};
  const errorKeys: string[] = Object.keys(error.errors);
  errorKeys.forEach((key: any) => {
    const CapKey = key.charAt(0).toUpperCase() + key.slice(1);

    const errExtract = error.errors[key].properties.reason;
    if (errExtract) {
      errorArray[key] = errExtract.errorArray;
    }

    const dupeMessage = error.errors[key].properties.message;
    if (dupeMessage === 'dupe') {
      errorArray[key] = [
        `${CapKey} is being currently used, use a different one`,
      ];
    }

    if (error.errors[key].kind === 'maxlength' && key !== 'displayName') {
      errorArray[key] = [error.errors[key].properties.message];
    }

    if (error.errors[key].properties.type === 'required') {
      errorArray[key] = [`${CapKey} is empty`];
    }
  });
  return errorArray;
};

export const multerErrorComposer = (err: any) => {
  const errorMessages = {
    LIMIT_PART_COUNT: 'Too many parts',
    LIMIT_FILE_SIZE: 'File too large',
    LIMIT_FILE_COUNT: 'Too many files',
    LIMIT_FIELD_KEY: 'Field name too long',
    LIMIT_FIELD_VALUE: 'Field value too long',
    LIMIT_FIELD_COUNT: 'Too many fields',
    LIMIT_UNEXPECTED_FILE: 'Unexpected field',
    MISSING_FIELD_NAME: 'Field name missing',
  };

  return { MAIN: [errorMessages[err.code]] };
};

export const parameterChecker = async (
  req: any,
  params: string[] = [],
  optionalParams: string[] = [],
  options: { [key: string]: boolean } = {
    needOneOptional: true,
    isJSONString: false,
    userCheck: false,
    isPost: false,
  }
): Promise<any> => {
  const reqKeys = Object.keys(options.isJSONString ? req : req.body);
  const errorArray: {
    [key: string]: string[];
  } = {};

  if (reqKeys.length === 0) {
    throw new ErrorAO({ MAIN: ['Missing parameters'] }, 'ParameterError');
  }
  if (
    !reqKeys.every((key: string) => {
      return params.includes(key) || optionalParams.includes(key);
    })
  ) {
    throw new ErrorAO(
      { MAIN: ['Invalid request, got invalid parameters'] },
      'ParameterError'
    );
  }

  if (options.isPost) {
    const post = await Post.findById(req.params.id);
    if (!post)
      throw new ErrorAO(
        { MAIN: ['No post by that ID'] },
        'ParameterError',
        404
      );
    if (!post.user._id.equals(req.user._id))
      throw new ErrorAO(
        { MAIN: ['You are not allowed to change this post'] },
        'ParameterError',
        403
      );
  }

  if (
    optionalParams.length !== 0 &&
    optionalParams.every((key) => !reqKeys.includes(key)) &&
    options.needOneOptional
  ) {
    errorArray.MAIN = [
      `Missing one of the following parameters: ${optionalParams.join(', ')}`,
    ];
  }
  for (let i = 0; i < params.length; i++) {
    const key: string = params[i];
    const errorKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (!reqKeys.includes(key)) {
      errorArray[key] = [`${errorKey} is missing and it's needed`];
    }
    if (options.userCheck) {
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
};

export const fileChecker = async (
  req: Request,
  allowedTypes: any,
  options: { [key: string]: boolean } = {
    isPatch: false,
  },
  post: any = null
) => {
  const whiteListedTypes = {
    images: ['png', 'jpg', 'gif'],
    videos: ['mp4', 'webm'],
    datafiles: ['pdf', 'zip'],
  };
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

  if (options.isPost) {
    for (const flaggedFile in req.body?.filesToRemove) {
      if (!post?.mediaArray.includes(flaggedFile)) {
        throw new ErrorAO(
          {
            MAIN: [`Some of the files don't exist anymore`],
          },
          'ParameterError'
        );
      }
    }
  }

  if (
    allowedTypes.every((key) => !mediaType.includes(key)) ||
    (options.isPost &&
      post.mediaType !== mediaType &&
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
    if (!meta || !whiteListedTypes[mediaType].includes(meta.ext)) {
      throw new ErrorAO(
        {
          MAIN: [
            `The only formats allowed are: ${whiteListedTypes[mediaType].join(
              ', '
            )}`,
          ],
        },
        'ParameterError'
      );
    }
  }
};

export const removeFiles = async (req: Request) => {
  if (!req.files) return;
  Object.keys(req.files).forEach(async (mediaType) => {
    const files = req.files[mediaType];
    for (let i = 0; i < files.length; i++) {
      await fs.unlink(`..\\..\\${files[i].path}\\${files[i].filename}`);
    }
  });
};
