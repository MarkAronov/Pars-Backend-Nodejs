/* eslint-disable @typescript-eslint/no-empty-function */
import express, { Response } from 'express';
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
import { Request } from 'src/utils/types.js';

const router = express.Router();

// / USER ROUTES ///

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
      const mediaType = Object.keys(req.files);

      for (let i = 0; i < mediaType.length; i++) {
        const fileFolderPath = path.join(
          utils.dirName(),
          `../../media/${mediaType[i]}s`,
        );
        const filename = req.files[mediaType[i]][0].filename;
        const meta = await fileTypeFromFile(req.files[mediaType[i]][0].path);
        fs.rename(
          `${fileFolderPath}/${filename}`,
          `${fileFolderPath}/${filename}.${meta.ext}`,
          () => {},
        );

        req.files[
          mediaType[i]
        ][0].filename = `${fileFolderPath}\\${filename}.${meta.ext}`;
        createdUser[mediaType[i]] = `${filename}.${meta.ext}`;
      }
    }

    await createdUser.save();

    const user = createdUser.toLimitedJSON(2);
    const token = await createdUser.generateToken();

    return res.status(201).send({ user, token });
  }),
);

// POST request for logging the user in.
router.post(
  '/users/login',
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const userToLimit = await User.verifyCredentials(
      req.body.email,
      req.body.password,
    );

    const user = userToLimit.toLimitedJSON(2);
    const token = await userToLimit.generateToken();

    return res.status(200).send({ user, token });
  }),
);

// POST request for logging the user out.
router.post(
  '/users/logout',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    req.user.tokens = req.user.tokens.filter(
      (tokens) => tokens.token !== req.token,
    );

    await req.user.save();
    return res.status(200).send();
  }),
);

// POST request for logging the user out from all sessions.
router.post(
  '/users/self/logoutall',
  auth,
  utils.wrap(async (req: Request, res: Response) => {
    req.user.tokens = [];

    await req.user.save();
    return res.status(200).send();
  }),
);

// // GET request for list of all Users.
router.get(
  '/users',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  async (req: Request, res: Response) => {
    const users = await User.find({});
    users.forEach((user) => {
      user.toLimitedJSON(2);
    });
    return res.status(200).send(users);
  },
);

// GET request for list of all Users.
router.get(
  '/users/self',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  async (req: Request, res: Response) => {
    let trimmedUser = {};
    await req.user.populate('posts');
    if (req.body.requestedFields) {
      Object.keys(req.user.toLimitedJSON(0)).forEach((key) => {
        if (req.body.requestedFields.includes(key)) {
          trimmedUser[key] = req.user[key];
        }
      });
    } else {
      trimmedUser = req.user.toLimitedJSON(0);
    }
    return res.status(200).send(trimmedUser);
  },
);

// GET request for one User.
router.get(
  '/users/u/:username',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user)
      throw new ErrorAO(
        {
          MAIN: [`No user with that name: ${req.params.username}`],
        },
        'VerificationError',
      );

    if (!user.settings.hidePosts) {
      await user.populate('posts');
    }

    return res.status(200).send(user.toLimitedJSON(2));
  }),
);

// PATCH requests to update User.
router.patch(
  '/users/self/password',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    await User.verifyPassword(req.user, req.body.currentPassword);

    req.user.password = req.body.newPassword;

    await req.user.save();
    return res.status(200).send();
  }),
);

router.patch(
  '/users/self/important',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    await User.verifyPassword(req.user, req.body.password);

    const reqKeys = Object.keys(req.body);

    reqKeys.forEach((key) => {
      if (key !== 'password') req.user[key] = req.body[key];
    });

    await req.user.save();

    return res.status(200).send(req.user.toLimitedJSON(2));
  }),
);

router.patch(
  '/users/self/regular',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const reqKeys = Object.keys(req.body);
    if (reqKeys.length) {
      reqKeys.forEach((key) => (req.user[key] = req.body[key]));
    }
    if (Object.keys(req.files).length) {
      const mediaType = Object.keys(req.files);
      for (let i = 0; i < mediaType.length; i++) {
        const fileFolderPath = path.join(
          utils.dirName(),
          `../../media/${mediaType[i]}s`,
        );
        const filename = req.files[mediaType[i]][0].filename;
        const meta = await fileTypeFromFile(req.files[mediaType[i]][0].path);
        fs.rename(
          `${fileFolderPath}/${filename}`,
          `${fileFolderPath}/${filename}.${meta.ext}`,
          () => {},
        );

        req.files[
          mediaType[i]
        ][0].filename = `${fileFolderPath}\\${filename}.${meta.ext}`;
        if (req.user[mediaType[i]]) {
          fs.rm(`${fileFolderPath}/${req.user[mediaType[i]]}`, () => {});
        }
        req.user[mediaType[i]] = `${filename}.${meta.ext}`;
      }
    }
    await req.user.save();
    return res.status(200).send(req.user.toLimitedJSON(2));
  }),
);

// DELETE requests to delete User or User objects.

router.delete(
  '/users/self',
  auth,
  utils.wrap(async (req: Request, res: Response) => {
    await req.user.deleteOne();
    return res.status(200).send();
  }),
);

router.delete(
  '/users/self/partial',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    if (req.body.requestedFields) {
      Object.keys(req.user.toLimitedJSON(0)).forEach((key) => {
        if (req.body.requestedFields.includes(key)) {
          if (key === 'avatar' || key === 'backgroundImage') {
            const filePath = path.join(
              utils.dirName(),
              `../../media/${key}s/${req.user[key]}`,
            );
            fs.rm(filePath, () => {});
            req.user[key] = null;
          } else {
            req.user[key] = '';
          }
        }
      });
    }
    await req.user.save();
    return res.status(200).send();
  }),
);

export default router;
