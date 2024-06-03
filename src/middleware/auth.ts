import jsonwebtoken, { Secret } from 'jsonwebtoken';
import { User } from '../models/usersModel.js';
import { Response, NextFunction } from 'express';
import { Request } from '../types/index.js';
import { ErrorAO, wrap } from '../utils/index.js';

/**
 * Middleware function for authenticating a user via a JWT token.
 * Throws an authentication error if the token is missing, invalid, or if the user is not found.
 */
const auth = wrap(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if the Authorization header is present
    if (!req.header('Authorization')) {
      throw new ErrorAO(
        { MAIN: ['Authenticate method is invalid'] },
        'AuthenticationError',
        401,
      );
    }

    // Extract the token from the Authorization header
    const encodedToken = req
      .header('Authorization')
      ?.replace('Bearer ', '') as string;

    let decodedToken: jsonwebtoken.JwtPayload;

    try {
      // Verify the token using the secret key from environment variables
      decodedToken = jsonwebtoken.verify(
        encodedToken,
        process.env['JWT_STRING'] as Secret,
      ) as jsonwebtoken.JwtPayload;
    } catch (e) {
      // Throw an error if the token is invalid
      throw new ErrorAO(
        { MAIN: ['Invalid token'] },
        'AuthenticationError',
        401,
      );
    }

    // Find the user associated with the token
    const user = await User.findOne({
      _id: decodedToken['id'] as string,
      'tokens.token': encodedToken,
    });

    // Throw an error if the user is not found
    if (!user) {
      throw new ErrorAO(
        { MAIN: ['Authenticate first'] },
        'AuthenticationError',
        401,
      );
    }

    // Attach the token and user to the request object
    req.token = encodedToken as string;
    req.user = user;

    // Proceed to the next middleware
    next();
  },
);

export default auth;
