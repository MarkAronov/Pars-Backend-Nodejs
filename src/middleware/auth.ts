import jsonwebtoken, { Secret } from 'jsonwebtoken';
import ErrorAO from '../utils/ErrorAO.js';
import { User } from '../models/usersModel.js';
import * as utils from '../utils/utils.js';
import { Request } from 'src/utils/types.js';
import { Response, NextFunction } from 'express';

const auth = utils.wrap(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.header('Authorization')) {
      throw new ErrorAO(
        { MAIN: ['Authenticate method is invalid'] },
        'AuthenticationError',
        401,
      );
    }

    const encodedToken = req
      .header('Authorization')
      ?.replace('Bearer ', '') as string;

    let decodedToken: jsonwebtoken.JwtPayload;

    try {
      decodedToken = jsonwebtoken.verify(
        encodedToken,
        process.env['JWT_STRING'] as Secret,
      ) as jsonwebtoken.JwtPayload;
    } catch (e) {
      throw new ErrorAO(
        { MAIN: ['Invalid token'] },
        'AuthenticationError',
        401,
      );
    }
    const user = await User.findOne({
      _id: decodedToken['id'] as string,
      'tokens.token': encodedToken,
    });
    if (!user) {
      throw new ErrorAO(
        { MAIN: ['Authenticate first'] },
        'AuthenticationError',
        401,
      );
    }
    req.token = encodedToken as string;
    req.user = user;
    next();
  },
);

export default auth;
