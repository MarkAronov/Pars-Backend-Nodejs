import validator from 'validator';
import ErrorArray from './ErrorArray.js';

// FUNCTIONS
export const filterDupes = (arr = []) => {
  const map = new Map();
  let filtered = [];
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
    nameErrors.push(['validation', 'Username contains whitespace']);
  if (!str.match(/^[0-9a-zA-Z\s]+$/))
    nameErrors.push([
      'validation',
      'Username contains none alphanumeric characters',
    ]);
  return nameErrors;
};

export const emailChecker = (str = '') => {
  const emailErrors = [];
  if (!validator.isEmail(str))
    emailErrors.push(['validation', 'Invalid email']);
  return emailErrors;
};

export const passwordChecker = (str = '') => {
  const passwordErrors = [];
  const lowercase = str.match(/[a-z]/);
  const uppercase = str.match(/[A-Z]/);
  const numbers = str.match(/[0-9]/);

  // Minimum: 10 chars | 1 Uppercase | 1 lowercase | 1 digit
  if (str.length < 10)
    passwordErrors.push(['validation', 'Password is less than 10 characters']);
  if (!lowercase)
    passwordErrors.push([
      'validation',
      'Password must have at least one lowercase',
    ]);
  if (!uppercase)
    passwordErrors.push([
      'validation',
      'Password must have at least one uppercase',
    ]);
  if (!numbers)
    passwordErrors.push([
      'validation',
      'Password must have at least one digit',
    ]);

  return passwordErrors;
};

export const entropy = (str) => {
  // Password entropy
  const E = str.length * Math.log2(filterDupes(str.split('')).length);

  return E;
};

export const parameterChecker = (
  req,
  params = [],
  optionalParams = [],
  options = {
    needOneOptional: true,
  }
) => {
  const reqKeys = Object.keys(req.body);
  const errors = {};

  if (reqKeys.length === 0) {
    throw new ErrorArray(['parameter', 'Missing parameters'], 'ParameterError');
  }
  if (
    !reqKeys.every((key) => {
      return params.includes(key) || optionalParams.includes(key);
    })
  ) {
    throw new ErrorArray(
      ['parameter', 'Invalid request, got invalid parameters'],
      'ParameterError'
    );
  }

  if (
    optionalParams.length !== 0 &&
    optionalParams.every((key) => !reqKeys.includes(key)) &&
    options.needOneOptional
  ) {
    errors.MAIN = [
      'parameter',
      `Missing one of the following parameters: ${optionalParams.join(', ')}`,
    ];
  }
  for (let i = 0; i < params.length; i++) {
    const key = params[i];
    const errorKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (!reqKeys.includes(key)) {
      errors[key] = ['verification', `${errorKey} is missing and it's needed`];
    }
  }
  if (Object.keys(errors).length) {
    throw new ErrorArray(errors, 'ParameterError');
  }
};
