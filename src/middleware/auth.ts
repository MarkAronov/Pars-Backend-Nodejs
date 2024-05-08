/* eslint-disable @typescript-eslint/no-explicit-any */
import jsonwebtoken from 'jsonwebtoken';
import ErrorAO from '../utils/ErrorAO.js';
import { User } from '../models/usersModel.js';
import * as utils from '../utils/utils.js';
import { Request } from 'src/utils/types.js';
import { Response } from 'express';

const auth = utils.wrap(
  async (req: Request, res: Response, next: () => void) => {
    if (!req.header('Authorization')) {
      throw new ErrorAO(
        { MAIN: ['Authenticate method is invalid'] },
        'AuthenticationError',
        401,
      );
    }
    const encodedToken = req.header('Authorization').replace('Bearer ', '');
    const decodedToken: any = jsonwebtoken.verify(
      encodedToken,
      process?.env?.JWT_STRING,
    );
    const user = await User.findOne({
      _id: decodedToken.id,
      'tokens.token': encodedToken,
    });
    if (!user) {
      throw new ErrorAO(
        { MAIN: ['Authenticate first'] },
        'AuthenticationError',
        401,
      );
    }
    req.token = encodedToken;
    req.user = user;
    next();
  },
);

export default auth;
