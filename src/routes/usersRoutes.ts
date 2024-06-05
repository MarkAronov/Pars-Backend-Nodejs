// Import necessary modules and dependencies
import express, { Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs';

import { User } from '../models/usersModel.js';
import {
  authMiddleware,
  jsonParserMiddleware,
  userMulter,
  requestCheckerMiddleware,
} from '../middleware/index.js';

import { ErrorAO, dirName, wrap } from '../utils/index.js';
import {
  UserMediaTypeKeys,
  Request,
  UserType,
  UserRegularPatchTypeKeys,
  UserPartialDeleteTypeKeys,
  IUser,
} from '../types/index.js';

// Create a new express router
export const usersRoutes = express.Router();

// / USER ROUTES ///

// POST request for creating a new User.
usersRoutes.post(
  '/users',
  userMulter, // Middleware for handling file uploads
  jsonParserMiddleware, // Middleware for parsing JSON data
  requestCheckerMiddleware, // Middleware for checking parameters
  wrap(async (req: Request, res: Response) => {
    const userData = req.body;
    userData.displayName = req.body.displayName || req.body.username;
    const createdUser = new User(userData);

    // Handle file uploads
    if (req.files && Object.keys(req.files).length) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const mediaTypes = Object.keys(files);

      for (const mediaType of mediaTypes) {
        const filesArray = files[mediaType];
        if (filesArray && filesArray.length > 0) {
          const file = filesArray[0];
          const fileFolderPath = path.join(
            dirName(),
            `../../media/${mediaType}s`,
          );
          const filename = file?.filename;
          const meta = await fileTypeFromFile(file?.path as string);
          const newFilename = `${filename}.${meta?.ext}`;
          await fs.rename(
            `${fileFolderPath}/${filename}`,
            `${fileFolderPath}/${newFilename}`,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
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
usersRoutes.post(
  '/users/login',
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
  wrap(async (req: Request, res: Response) => {
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
usersRoutes.post(
  '/users/logout',
  authMiddleware, // Middleware for authentication
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
  wrap(async (req: Request, res: Response) => {
    if (req.user) {
      req.user.tokens = req.user.tokens?.filter(
        (tokens) => tokens.token !== req.token,
      ) as { token: string }[];

      await req.user.save();
    }

    return res.status(200).send();
  }),
);

// POST request for logging the user out from all sessions.
usersRoutes.post(
  '/users/self/logoutall',
  authMiddleware, // Middleware for authentication
  wrap(async (req: Request, res: Response) => {
    if (req.user) {
      req.user.tokens = [];
      await req.user.save();
    }
    return res.status(200).send();
  }),
);

// GET request for list of all Users.
usersRoutes.get(
  '/users',
  authMiddleware, // Middleware for authentication
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response) => {
    const users: UserType[] = await User.find({});
    users.forEach((user) => {
      user.toLimitedJSON(2);
    });
    return res.status(200).send(users);
  },
);

// GET request for the authenticated User's details.
usersRoutes.get(
  '/users/self',
  authMiddleware, // Middleware for authentication
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
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

// GET request for one User by username.
usersRoutes.get(
  '/users/u/:username',
  authMiddleware, // Middleware for authentication
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
  wrap(async (req: Request, res: Response) => {
    const user = await User.findOne({ username: req.params['username'] });
    if (!user) {
      throw new ErrorAO(
        {
          MAIN: [`No user with that name: ${req.params['username']}`],
        },
        'VerificationError',
      );
    }
    if (user.settings?.hidePosts) {
      await user.populate('posts');
    }

    return res.status(200).send(user.toLimitedJSON(2));
  }),
);

// PATCH request to update User's password.
usersRoutes.patch(
  '/users/self/password',
  authMiddleware, // Middleware for authentication
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
  wrap(async (req: Request, res: Response) => {
    if (req.user) {
      await req.user.verifyPassword(req.body.currentPassword);

      req.user.password = req.body.newPassword;

      await req.user.save();
    }
    return res.status(200).send();
  }),
);

// PATCH request to update important User details.
usersRoutes.patch(
  '/users/self/important',
  authMiddleware, // Middleware for authentication
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
  wrap(async (req: Request, res: Response) => {
    if (req.user) {
      await req.user.verifyPassword(req.body.password);

      const reqKeys = Object.keys(req.body);
      for (const reqKey of reqKeys) {
        if (reqKey !== 'password' && req.user) {
          req.user[reqKey as keyof IUser] = req.body[reqKey];
        }
      }

      await req.user.save();
      return res.status(200).send(req.user.toLimitedJSON(2));
    }
    return res.status(200).send();
  }),
);

// PATCH request to update regular User details.
usersRoutes.patch(
  '/users/self/regular',
  authMiddleware, // Middleware for authentication
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
  wrap(async (req: Request, res: Response) => {
    const userData = req.body;
    const reqKeys = Object.keys(userData);
    if (req.user) {
      for (const reqKey of reqKeys) {
        req.user[reqKey as UserRegularPatchTypeKeys] = req.body[reqKey];
      }

      // Handle file uploads
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
              dirName(),
              `../../media/${mediaType}s`,
            );
            let filename = file?.filename;
            const meta = await fileTypeFromFile(file?.path as string);
            const newFilename = `${filename}.${meta?.ext}`;

            await fs.rename(
              `${fileFolderPath}/${filename}`,
              `${fileFolderPath}/${newFilename}`,
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              () => {},
            );

            filename = `${fileFolderPath}\\${filename}.${meta?.ext}`;

            if (req.user[mediaType as UserMediaTypeKeys]) {
              console.log(`${req.user[mediaType as UserMediaTypeKeys]}`);
              await fs.rm(
                `${req.user[mediaType as UserMediaTypeKeys]}`,
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                () => {},
              );
            }

            req.user[mediaType as UserMediaTypeKeys] = filename;
          }
        }
      }
      await req.user.save();
      return res.status(200).send(req.user.toLimitedJSON(2));
    }
    return res.status(200).send();
  }),
);

// DELETE request to delete the authenticated User.
usersRoutes.delete(
  '/users/self',
  authMiddleware, // Middleware for authentication
  wrap(async (req: Request, res: Response) => {
    await req?.user?.deleteOne();
    return res.status(200).send();
  }),
);

// DELETE request to partially delete User objects.
usersRoutes.delete(
  '/users/self/partial',
  authMiddleware, // Middleware for authentication
  userMulter,
  jsonParserMiddleware,
  requestCheckerMiddleware,
  wrap(async (req: Request, res: Response) => {
    if (req.user && req.body.requestedFields) {
      const userKeys = Object.keys(req.user.toLimitedJSON(0));
      for (const userKey of userKeys) {
        if (req.body.requestedFields.includes(userKey)) {
          if (userKey === 'avatar' || userKey === 'backgroundImage') {
            const filePath = path.join(
              dirName(),
              `../../media/${userKey}s/${
                req.user[userKey as UserMediaTypeKeys]
              }`,
            );
            // eslint-disable-next-line @typescript-eslint/no-empty-function
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
