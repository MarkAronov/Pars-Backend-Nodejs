/* eslint-disable @typescript-eslint/no-empty-function */
import express, { Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs';

import { IUser, User } from '../models/usersModel.js';

import auth from '../middleware/auth.js';
import jsonParser from '../middleware/jsonParser.js';
import { userMulter } from '../middleware/multer.js';
import parameterChecker from '../middleware/parameterChecker.js';

import ErrorAO from '../utils/ErrorAO.js';
import * as utils from '../utils/utils.js';
import {
  UserMediaTypeKeys,
  Request,
  UserType,
  UserRegularPatchTypeKeys,
  UserPartialDeleteTypeKeys,
} from 'src/utils/types.js';

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
    userData.displayName = req.body.displayName || req.body.username;
    const createdUser = new User(userData);

    if (req.files && Object.keys(req.files).length) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const mediaTypes = Object.keys(files);

      for (const mediaType of mediaTypes) {
        const filesArray = files[mediaType];
        if (filesArray && filesArray.length > 0) {
          const file = filesArray[0];
          const fileFolderPath = path.join(
            utils.dirName(),
            `../../media/${mediaType}s`,
          );
          const filename = file?.filename;
          const meta = await fileTypeFromFile(file?.path as string);
          const newFilename = `${filename}.${meta?.ext}`;
          await fs.rename(
            `${fileFolderPath}/${filename}`,
            `${fileFolderPath}/${newFilename}`,
            () => {},
          );

          // Update the file information in the request object and user data
          if (file) file.filename = path.join(fileFolderPath, newFilename);
          createdUser[mediaType as UserMediaTypeKeys] = newFilename;
        }
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
    if (req.user) {
      req.user.tokens = req.user.tokens?.filter(
        (tokens) => tokens.token !== req.token,
      ) as {
        token: string;
      }[];

      await req.user.save();
    }

    return res.status(200).send();
  }),
);

// POST request for logging the user out from all sessions.
router.post(
  '/users/self/logoutall',
  auth,
  utils.wrap(async (req: Request, res: Response) => {
    if (req.user) {
      req.user.tokens = [];
      await req.user.save();
    }
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
    const users: UserType[] = await User.find({});
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
    let trimmedUser: Partial<UserType> = {};
    if (req.user) {
      await req.user.populate('posts');
      if (req.body.requestedFields) {
        const userKeys = Object.keys(req.user.toLimitedJSON(0));
        for (const userKey of userKeys)
          if (req.user && req.body.requestedFields.includes(userKey)) {
            let trimmedUserVal = trimmedUser[userKey as keyof Partial<IUser>];
            if (trimmedUserVal)
              trimmedUserVal = req.user[userKey as keyof IUser];
          }
      } else {
        trimmedUser = req.user.toLimitedJSON(0);
      }
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
    const user = await User.findOne({ username: req.params['username'] });
    if (!user)
      throw new ErrorAO(
        {
          MAIN: [`No user with that name: ${req.params['username']}`],
        },
        'VerificationError',
      );

    if (user.settings?.hidePosts) {
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
    if (req.user) {
      await req.user.verifyPassword(req.body.currentPassword);

      req.user.password = req.body.newPassword;

      await req.user.save();
    }
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
    if (req.user) {
      await req.user.verifyPassword(req.body.password);

      const reqKeys = Object.keys(req.body);
      for (const reqKey of reqKeys) {
        if (reqKey !== 'password' && req.user)
          req.user[reqKey as keyof IUser] = req.body[reqKey];
      }

      await req.user.save();
      return res.status(200).send(req.user.toLimitedJSON(2));
    }
    return res.status(200).send();
  }),
);

router.patch(
  '/users/self/regular',
  auth,
  userMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const userData = req.body;
    const reqKeys = Object.keys(userData);
    if (req.user) {
      for (const reqKey of reqKeys) {
        req.user[reqKey as UserRegularPatchTypeKeys] = req.body[reqKey];
      }

      if (req.files && Object.keys(req.files).length) {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const mediaTypes = Object.keys(files);

        for (const mediaType of mediaTypes) {
          const filesArray = files[mediaType];
          if (filesArray && filesArray.length > 0) {
            const file = filesArray[0];
            const fileFolderPath = path.join(
              utils.dirName(),
              `../../media/${mediaType}s`,
            );
            let filename = file?.filename;
            const meta = await fileTypeFromFile(file?.path as string);
            const newFilename = `${filename}.${meta?.ext}`;
            await fs.rename(
              `${fileFolderPath}/${filename}`,
              `${fileFolderPath}/${newFilename}`,
              () => {},
            );

            filename = `${fileFolderPath}\\${filename}.${meta?.ext}`;
            if (req.user[mediaType as UserMediaTypeKeys]) {
              fs.rm(
                `${fileFolderPath}/${req.user[mediaType as UserMediaTypeKeys]}`,
                () => {},
              );
            }
            req.user[
              mediaType as UserMediaTypeKeys
            ] = `${filename}.${meta?.ext}`;
          }
        }
      }
      await req.user.save();
      return res.status(200).send(req.user.toLimitedJSON(2));
    }
    return res.status(200).send();
  }),
);

// DELETE requests to delete User or User objects.

router.delete(
  '/users/self',
  auth,
  utils.wrap(async (req: Request, res: Response) => {
    await req?.user?.deleteOne();
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
    if (req.user && req.body.requestedFields) {
      const userKeys = Object.keys(req.user.toLimitedJSON(0));
      for (const userKey of userKeys) {
        if (req.body.requestedFields.includes(userKey)) {
          if (userKey === 'avatar' || userKey === 'backgroundImage') {
            const filePath = path.join(
              utils.dirName(),
              `../../media/${userKey}s/${
                req.user[userKey as UserMediaTypeKeys]
              }`,
            );
            fs.rm(filePath, () => {});
            req.user[userKey as UserMediaTypeKeys] = null;
          } else {
            req.user[userKey as UserPartialDeleteTypeKeys] = null;
          }
        }
      }

      await req.user.save();
    }
    return res.status(200).send();
  }),
);

export default router;
