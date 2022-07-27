import jsonwebtoken from 'jsonwebtoken';
import { User } from '../models/usersModel.js';

const auth = async (req: any, res: any, next: () => void) => {
  try {
    if (!req.header('Authorization')) throw new Error('401');
    const uncodedToken = req.header('Authorization').replace('Bearer ', '');
    const decodedToken: any = jsonwebtoken.verify(
      uncodedToken,
      process.env.JWT_STRING!
    );
    const user = await User.findOne({
      _id: decodedToken.id,
      'tokens.token': uncodedToken,
    });
    if (!user) throw new Error('401');
    req.token = uncodedToken;
    req.user = user;
    next();
  } catch (e: any) {
    if (e.message === '401')
      res.status(401).send({ error: 'Authenticate first' });
    else res.status(500).send(e);
  }
};

export default auth;
