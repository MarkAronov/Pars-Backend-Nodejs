import { Request } from '../types/index.js';
import { Response, NextFunction } from 'express';
import { ErrorAO } from '../utils/index.js';

/**
 * Middleware to parse JSON content from a request body.
 * Checks if the request body contains a 'content' field and parses it as JSON.
 * Merges the parsed JSON content with the rest of the request body.
 * Throws an error if the JSON content is invalid.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */

export const jsonParserMiddleware = (
  req: Request,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  res: Response,
  next: NextFunction,
) => {
  if (req.body && Object.keys(req.body).includes('content')) {
    try {
      const reqJSONContent =
        typeof JSON.parse(req.body.content) === 'string'
          ? JSON.parse(JSON.parse(req.body.content))
          : JSON.parse(req.body.content);

      // Remove the 'content' field from the request body
      delete req.body.content;

      // Merge the parsed JSON content with the request body
      req.body = Object.assign({}, req.body, reqJSONContent);
    } catch (err) {
      throw new ErrorAO({ MAIN: ['invalid JSON string'] }, 'ParameterError');
    }
  }
  next();
};
