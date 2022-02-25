const ErrorArray = require("./ErrorArray")

exports.parameterChecker = (req, params) => {
  const reqKeys = Object.keys(req.body)
  if (!reqKeys.every((key) => params.includes(key))) {
    throw new ErrorArray(['param', 'Invalid'], 'ParameterError')
  }
}