/* eslint-disable @typescript-eslint/no-empty-function */
import { Request } from 'src/utils/types.js';
import validator from 'validator';
import fs from 'fs';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
// FUNCTIONS

export const dirName = () => dirname(fileURLToPath(import.meta.url));

/**
 * Normalize a port into a number, string, or false.
 * @param {string} val
 * @return {any}
 */
export const normalizePort = (val: string): boolean | string | number => {
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

export const usernameChecker = (str = ''): string[] => {
  const nameErrors = [];

  if (validator.contains(str, ' '))
    nameErrors.push('Username contains whitespace');
  if (!str.match(/^[0-9a-zA-Z\s]+$/))
    nameErrors.push('Username contains none alphanumeric characters');
  return nameErrors;
};

export const emailChecker = (str = ''): string[] => {
  const emailErrors = [];

  if (!validator.isEmail(str)) emailErrors.push('Invalid email');
  return emailErrors;
};

export const passwordChecker = (str = ''): string[] => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validationErrorComposer = (error: any) => {
  const errorArray: { [key: string]: string[] } = {};
  const errorKeys: string[] = Object.keys(error.errors);
  for (const errorKey of errorKeys) {
    const CapKey = errorKey.charAt(0).toUpperCase() + errorKey.slice(1);

    const errExtract = error.errors[errorKey].properties.reason;
    if (errExtract) {
      errorArray[errorKey] = errExtract.errorArray;
    }

    const dupeMessage = error.errors[errorKey].properties.message;
    if (dupeMessage === 'dupe') {
      errorArray[errorKey] = [
        `${CapKey} is being currently used, use a different one`,
      ];
    }

    if (
      error.errors[errorKey].kind === 'maxlength' &&
      errorKey !== 'displayName'
    ) {
      errorArray[errorKey] = [error.errors[errorKey].properties.message];
    }

    if (error.errors[errorKey].properties.type === 'required') {
      errorArray[errorKey] = [`${CapKey} is empty`];
    }
  }
  return errorArray;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const multerErrorComposer = (error: any) => {
  const errorMessages: { [index: string]: string } = {
    LIMIT_PART_COUNT: 'Too many parts',
    LIMIT_FILE_SIZE: 'File too large',
    LIMIT_FILE_COUNT: 'Too many files',
    LIMIT_FIELD_KEY: 'Field name too long',
    LIMIT_FIELD_VALUE: 'Field value too long',
    LIMIT_FIELD_COUNT: 'Too many fields',
    LIMIT_UNEXPECTED_FILE: 'Unexpected file',
    MISSING_FIELD_NAME: 'Field name missing',
  };

  return { media: [errorMessages[error.code]] };
};

export const removeFiles = async (req: Request) => {
  if (!req.files) return;

  const filesGroupedByMediaType = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  await Promise.all(
    Object.keys(filesGroupedByMediaType).map(async (mediaType: string) => {
      const files = filesGroupedByMediaType[mediaType];
      if (files)
        await Promise.all(files.map((file) => fs.rm(file.path, () => {})));
    }),
  );
};

// export const removeFiles = async (req: Request) => {
//   if (!req.files) return;
//   Object.keys(req.files).forEach(async (mediaType: string) => {
//     if (req.files !== undefined) {
//       const files = req.files[mediaType];
//       for (let i = 0; i < files.length; i++) {
//         await fs.rm(`${files[i].path}`, () => {});
//       }
//     }
//   });
// };

export const wrap =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, prettier/prettier


    (fn: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any) =>
      fn(...args).catch(args[2]);
