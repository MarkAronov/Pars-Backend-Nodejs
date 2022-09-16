import express, { Request, Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs';

import { User } from '../models/usersModel.js';

import auth from '../middleware/auth.js';
import jsonParser from '../middleware/jsonParser.js';
import { userMulter } from '../middleware/multer.js';
import parameterChecker from '../middleware/parameterChecker.js';

import ErrorAO from '../utils/ErrorAO.js';
import * as utils from '../utils/utils.js';

const router = express.Router();

// / USER ROUTES ///

// GET request for list of all Users.
router.get('/users/', async (req, res) => {
  const users = await User.find({});
  return res.status(200).send(users);
});

// GET request for one User.
router.get(
  '/users/:username',
  utils.wrap(async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user)
      throw new ErrorAO(
        {
          MAIN: [`No user with that name: ${req.params.username}`],
        },
        'VerificationError'
      );

    if (!user.settings.hidePosts) {
      await user.populate('posts');
    }

    return res.status(200).send(user.toLimitedJSON(2));
  })
);

// POST request for logging the user in.
router.post(
  '/users/login',
  utils.wrap(async (req, res) => {
    const userToLimit = await User.verifyCredentials(
      req.body.email,
      req.body.password
    );

    const token = await userToLimit.generateToken(userToLimit);
    const user = userToLimit.toLimitedJSON(userToLimit, 2);
    return res.status(200).send({ user, token });
  })
);

// POST request for logging the user out.
router.post(
  '/users/logout',
  auth,
  utils.wrap(async (req: any, res: Response) => {
    req.user.tokens = req.user.tokens.filter((token: any) => {
      return token.token !== req.token;
    });

    await req.user.save();
    return res.status(200).send();
  })
);

// POST request for logging the user out from all sessions.
router.post(
  '/users/logoutall',
  auth,
  utils.wrap(async (req: any, res: Response) => {
    req.user.tokens = [];

    await req.user.save();
    return res.status(200).send();
  })
);

// POST request for creating User.
router.post(
  '/users',
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const userData = req.body;
    userData.displayName = req.body.displayName
      ? req.body.displayName
      : req.body.username;
    const createdUser = new User(userData);

    if (Object.keys(req.files).length) {
      const mediaType = Object.keys(req.files)[0];
      // const fileFolderPath = path.join(
      //   utils.dirName(),
      //   `../../media/${mediaType}s`
      // );
      const filename = req.files[mediaType][0].filename;
      const meta = await fileTypeFromFile(req.files[mediaType][0].path);
      // await fs.rename(
      //   `${fileFolderPath}/${filename}`,
      //   `${fileFolderPath}/${filename}.${meta.ext}`,
      //   () => {}
      // );

      createdUser[mediaType] = `${filename}.${meta.ext}`;
    }
    await createdUser.save();

    const user = createdUser.toLimitedJSON(2);
    const token = await createdUser.generateToken();

    return res.status(201).send({ user, token });
  })
);

// DELETE request to delete User.
router.delete(
  '/users/me',
  auth,
  utils.wrap(async (req: any, res: Response) => {
    await req.user.remove();
    return res.status(200).send();
  })
);

// PATCH request to update User.
router.patch(
  '/users/me/password',
  auth,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: any, res: Response) => {
    await User.verifyPassword(req.user, req.body.currentPassword);

    req.user.password = req.body.newPassword;

    await req.user.save();
    return res.status(200).send();
  })
);

router.patch(
  '/users/me/important',
  auth,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: any, res: Response) => {
    await User.verifyPassword(req.user, req.body.password);

    const reqKeys = Object.keys(req.body);

    reqKeys.forEach((key) => {
      if (key !== 'password') req.user[key] = req.body[key];
    });

    await req.user.save();

    return res.status(200).send({
      full: req.user.toLimitedJSON(req.user, 0),
      auth: req.user.toLimitedJSON(req.user, 2),
    });
  })
);

router.patch(
  '/users/me/regular',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: any, res: Response) => {
    const reqKeys = Object.keys(req.body);

    reqKeys.forEach((key) => (req.user[key] = req.body[key]));

    await req.user.save();
    return res.status(200).send(req.user.toLimitedJSON(req.user, 2));
  })
);

export default router;
