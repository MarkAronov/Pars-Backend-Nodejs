/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as utils from '../utils/utils.js';

const errorHandler = async (err, req, res, next) => {
  const preComposedErrors = [
    'AuthenticationError',
    'ParameterError',
    'VerificationError',
  ];
  const urlsThatUploadFiles = [
    '/users',
    '/users/self/regular',
    '/posts',
    '/posts/:id',
  ];

  console.log(err);

  if (req.route.path === '/media/:mediatype/:mediafile') {
    return res.status(404).send({
      media: 'file does not exist',
    });
  }
  if (
    urlsThatUploadFiles.includes(req.route.path) &&
    (req.method === 'POST' || req.method === 'PATCH')
  ) {
    await utils.removeFiles(req);
  }
  if (err.name === 'ValidationError') {
    return res.status(400).send({ ERROR: utils.validationErrorComposer(err) });
  } else if (err.name === 'MulterError') {
    return res.status(400).send(utils.multerErrorComposer(err));
  } else if (preComposedErrors.includes(err.name)) {
    return res.status(err.status).send(err.errorAO);
  } else return res.status(500).send(err.toString());
};

export default errorHandler;
