const ErrorArray = require('./ErrorArray');

exports.parameterChecker = (req, params, optionalParams = []) => {
  const reqKeys = Object.keys(req.body);

  if (!params.every((key) => reqKeys.includes(key))) {
    throw new ErrorArray(['param', 'Invalid'], 'ParameterError');
  }

  if (
    !reqKeys.every((key) => {
      return params.includes(key) || optionalParams.includes(key);
    })
  ) {
    throw new ErrorArray(['param', 'Invalid'], 'ParameterError');
  }
};
