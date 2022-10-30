import * as utils from '../utils/utils.js';

const errorHandler = async (err, req, res, next) => {
  const preComposedErrors = [
    'AuthenticationError',
    'ParameterError',
    'VerificationError',
  ];
  const urlsThatUploadFiles = [
    '/posts',
    '/users/me/:mediatype',
    '/posts/:id',
    '/users/me',
    '/users',
  ];
  console.log(err)
  if (
    urlsThatUploadFiles.includes(req.route.path) &&
    (req.method === 'POST' || req.method === 'PATCH')
  ) {
    await utils.removeFiles(req);
  }
  if (err.name === 'ValidationError') {
    return res.status(400).send(utils.validationErrorComposer(err));
  } else if (err.name === 'MulterError') {
    return res.status(400).send(utils.multerErrorComposer(err));
  } else if (preComposedErrors.includes(err.name)) {
    return res.status(err.status).send(err.errorAO);
  } else return res.status(500).send(err.toString());
};

export default errorHandler;
