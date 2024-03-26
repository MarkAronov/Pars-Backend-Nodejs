/* eslint-disable @typescript-eslint/no-empty-function */
import { Request } from 'express';
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

export const validationErrorComposer = (error) => {
  const errorArray: { [key: string]: string[] } = {};
  const errorKeys: string[] = Object.keys(error.errors);
  errorKeys.forEach((key: string) => {
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

export const multerErrorComposer = (err) => {
  const errorMessages = {
    LIMIT_PART_COUNT: 'Too many parts',
    LIMIT_FILE_SIZE: 'File too large',
    LIMIT_FILE_COUNT: 'Too many files',
    LIMIT_FIELD_KEY: 'Field name too long',
    LIMIT_FIELD_VALUE: 'Field value too long',
    LIMIT_FIELD_COUNT: 'Too many fields',
    LIMIT_UNEXPECTED_FILE: 'Unexpected file',
    MISSING_FIELD_NAME: 'Field name missing',
  };

  return { media: [errorMessages[err.code]] };
};

export const removeFiles = async (req: Request) => {
  if (!req.files) return;
  Object.keys(req.files).forEach(async (mediaType) => {
    const files = req.files[mediaType];
    for (let i = 0; i < files.length; i++) {
      await fs.rm(`${files[i].path}`, () => {});
    }
  });
};

export const wrap =
  (fn) =>
  (...args) =>
    fn(...args).catch(args[2]);
