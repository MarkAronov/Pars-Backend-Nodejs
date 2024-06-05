import { NextFunction, Response } from 'express';
import { Request } from '../types/index.js';
import {
  multerErrorComposer,
  removeFiles,
  validationErrorComposer,
} from '../utils/index.js';

/**
 * Error-handling middleware for Express applications.
 * Handles various types of errors and sends appropriate responses to the client.
 * Cleans up uploaded files if necessary and logs the error for debugging purposes.
 *
 * @param {any} err - The error object caught by the middleware.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function (unused).
 */
export const errorHandlerMiddleware = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
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

  // Handle requests for non-existent media files
  if (req.route.path === '/media/:mediatype/:mediafile') {
    return res.status(404).send({
      media: 'file does not exist',
    });
  }

  // Remove uploaded files if the request fails and involves file uploads
  if (
    urlsThatUploadFiles.includes(req.route.path) &&
    (req.method === 'POST' || req.method === 'PATCH')
  ) {
    await removeFiles(req);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).send({ ERROR: validationErrorComposer(err) });
  }
  // Handle Multer errors
  else if (err.name === 'MulterError') {
    return res.status(400).send(multerErrorComposer(err));
  }
  // Handle pre-composed errors
  else if (preComposedErrors.includes(err.name)) {
    return res.status(err.status).send(err.errorAO);
  }
  // Handle generic server errors
  else {
    return res.status(500).send(err.toString());
  }
};
