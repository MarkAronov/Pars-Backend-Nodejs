import jsonwebtoken from 'jsonwebtoken';
import ErrorAO from '../utils/ErrorAO.js';
import { User } from '../models/usersModel.js';
import * as utils from '../utils/utils.js';

const auth = utils.wrap(async (req: any, res: any, next: () => void) => {
  if (!req.header('Authorization')) {
    throw new ErrorAO(
      { MAIN: ['Authenticate method is invalid'] },
      'AuthenticationError',
      401
    );
  }
  const uncodedToken = req.header('Authorization').replace('Bearer ', '');
  const decodedToken: any = jsonwebtoken.verify(
    uncodedToken,
    process.env.JWT_STRING!
  );
  const user = await User.findOne({
    _id: decodedToken.id,
    'tokens.token': uncodedToken,
  });
  if (!user) {
    throw new ErrorAO(
      { MAIN: ['Authenticate first'] },
      'AuthenticationError',
      401
    );
  }
  req.token = uncodedToken;
  req.user = user;
  next();
});

export default auth;
