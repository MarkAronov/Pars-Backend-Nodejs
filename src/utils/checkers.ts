import { Request } from 'express';
import validator from 'validator';
import ErrorAO from './ErrorAO.js';

// FUNCTIONS
export const filterDupes = (arr = []) => {
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

export const usernameChecker = (str = '') => {
  const nameErrors = [];

  if (validator.contains(str, ' '))
    nameErrors.push('Username contains whitespace');
  if (!str.match(/^[0-9a-zA-Z\s]+$/))
    nameErrors.push('Username contains none alphanumeric characters');
  return nameErrors;
};

export const emailChecker = (str = '') => {
  const emailErrors = [];

  if (!validator.isEmail(str)) emailErrors.push('Invalid email');
  return emailErrors;
};

export const passwordChecker = (str = '') => {
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

export const entropy = (str: {
  length: number;
  split: (arg0: string) => never[] | undefined;
}) => {
  // Password entropy
  const E = str.length * Math.log2(filterDupes(str.split('')).length);

  return E;
};

export const parameterChecker = (
  req: Request,
  params: Array<string> = [],
  optionalParams: Array<string> = [],
  options = {
    needOneOptional: true,
  }
) => {
  const reqKeys = Object.keys(req.body);
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
