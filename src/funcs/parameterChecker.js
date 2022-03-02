const ErrorArray = require('./ErrorArray');

exports.parameterChecker = (req, params = [], optionalParams = []) => {
  const reqKeys = Object.keys(req.body);
  const errors = {};
  console.log(reqKeys);
  if (reqKeys.length === 0) throw new Error('Missing parameters');
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

  if (optionalParams.every((key) => !reqKeys.includes(key))) {
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
