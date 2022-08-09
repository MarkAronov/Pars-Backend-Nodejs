import { Request } from 'express';
import validator from 'validator';
import ErrorAO from './ErrorAO.js';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

// FUNCTIONS

export const errorComposer = (error: any) => {
  const errorArray: { [key: string]: string[] } = {};
  const errorKeys: Array<string> = Object.keys(error.errors);
  errorKeys.forEach((key: any) => {
    const CapKey = key.charAt(0).toUpperCase() + key.slice(1);

    const errExtract = error.errors[key].properties.reason;
    if (errExtract) {
      errorArray[key] = errExtract.errorArray;
    }

    const dupeMessage = error.errors[key].properties.message;
    if (dupeMessage === 'dupe') {
      errorArray[key] = [
        `${CapKey} is being currently used, try a different one`,
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
  let filtered: Array<string> = [];
  for (const a of arr) {
    if (map.get(a) === undefined) {
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

export const parameterChecker = (
  req: Request,
  params: Array<string> = [],
  optionalParams: Array<string> = [],
  options: { [key: string]: boolean } = {
    needOneOptional: true,
    isJSONString: false,
  }
): void => {
  const reqKeys = Object.keys(
    options.isJSONString ? JSON.parse(req.body.jsoncontent) : req.body
  );
  const errorArray:
    | {
        [key: string]: string[];
      }
    | string[][] = {};

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
  }
  if (Object.keys(errorArray).length) {
    throw new ErrorAO(errorArray, 'ParameterError');
  }
};
