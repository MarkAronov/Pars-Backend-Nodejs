import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

import { User } from '../models/usersModel.js';
import auth from '../middleware/auth.js';
import { userMulter } from '../middleware/multer.js';
import errorComposer from '../utils/errorComposer.js';
import { parameterChecker } from '../utils/checkers.js';
import dirName from '../utils/dirName.js';
import { Error } from 'mongoose';

const router = express.Router();

router.post(
  '/users/me/:mediatype',
  auth,
  userMulter,
  async (req: any, res: Response) => {
    const mediaType: string = req.params.mediatype;
    if (mediaType !== 'avatar' && mediaType !== 'backgroundImage') {
      return res
        .status(400)
        .send('Either upload an avatar or a background image');
    }
    if (req.files !== undefined) {
      const whiteListedTypes = ['png', 'jpg', 'gif'];
      const filePath = path.join(dirName(), `../../media/${mediaType}s`);
      const filename = req.files[mediaType][0].filename;
      const meta = await fileTypeFromFile(req.files[mediaType][0].path);

      if (meta === undefined || !whiteListedTypes.includes(meta.ext)) {
        await fs.unlink(`${filePath}/${filename}`);
        return res
          .status(400)
          .send('The only formats allowed are PNG, JPG and GIF');
      }
      const fullName = `${filename}.${meta.ext}`;

      try {
        if (req.user[mediaType]) {
          await fs.unlink(`${filePath}/${req.user[mediaType]}`);
        }
      } catch (error) {}
      await fs.rename(`${filePath}/${filename}`, `${filePath}/${fullName}`);
      req.user[mediaType] = fullName;
      await req.user.save();
      return res.status(200).send(fullName);
    } else return res.status(400).send();
  },
  (error: Error, _req: Request, res: Response) => {
    return res.status(400).send(error.message);
  }
);

router.get('/users/:username/:mediatype', async (req, res) => {
  try {
    const mediaType = req.params.mediatype;
    if (mediaType !== 'avatar' && mediaType !== 'backgroundImage')
      return res.status(400).send();
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).send();

    if (user[mediaType]) {
      const filePath = path.join(
        dirName(),
        `../../media/${mediaType}s/${user[mediaType]}`
      );
      return res.status(200).sendFile(filePath);
    } else {
      return res.status(404).send();
    }
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

router.delete('/users/me/:mediatype', auth, async (req: any, res: Response) => {
  try {
    const mediaType = req.params.mediatype;
    if (mediaType !== 'avatar' && mediaType !== 'backgroundImage')
      return res.status(400).send();
    if (req.user.avatar && mediaType === 'avatar') {
      await fs.unlink(
        path.join(dirName(), `../../media/${mediaType}s/${req.user.avatar}`)
      );
      req.user.avatar = null;
      await req.user.save();
    }
    if (req.user.backgroundImage && mediaType === 'backgroundImage') {
      await fs.unlink(
        path.join(
          dirName(),
          `../../media/${mediaType}s/${req.user.backgroundImage}`
        )
      );
      req.user.backgroundImage = null;
      await req.user.save();
    }
    return res.status(200).send();
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// / USER ROUTES ///

// GET request for list of all Users.
router.get('/users/', async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).send(users);
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// GET request for one User.
router.get('/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).send();

    if (!user.settings.hidePosts) {
      await user.populate('posts');
    }

    return res.status(200).send(user.toLimitedJSON(2));
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// POST request for logging the user in.
router.post('/users/login', async (req, res) => {
  try {
    parameterChecker(req, ['email', 'password']);

    const userToLimit = await User.verifyCredentials(
      req.body.email,
      req.body.password
    );
    const token = await userToLimit.generateToken(userToLimit);
    const user = userToLimit.toLimitedJSON(userToLimit, 2);
    return res.status(200).send({ user, token });
  } catch (error: any) {
    if (error.name === 'VerificationError') {
      return res.status(400).send(error.errorArray);
    }
    if (error.name === 'ParameterError' || error.name === 'VerificationError') {
      return res.status(400).send(error.errorArray);
    }
    return res.status(500).send(error.toString());
  }
});

// POST request for logging the user out.
router.post('/users/logout', auth, async (req: any, res: Response) => {
  try {
    req.user.tokens = req.user.tokens.filter((token: any) => {
      return token.token !== req.token;
    });
    await req.user.save();
    return res.status(200).send();
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// POST request for logging the user out from all sessions.
router.post('/users/logoutall', auth, async (req: any, res: Response) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    return res.status(200).send();
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// POST request for creating User.
router.post('/users', async (req: Request, res: Response) => {
  try {
    parameterChecker(req, ['email', 'username', 'password']);

    const userData = req.body;
    userData.displayName = userData.username;
    const createdUser = new User(userData);
    await createdUser.save();

    const user = createdUser.toLimitedJSON(2);
    const token = await createdUser.generateToken();

    return res.status(201).send({ user, token });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).send(errorComposer(error));
      //return res.status(500).send();
    }
    if (error.name === 'ParameterError' || error.name === 'VerificationError') {
      return res.status(400).send(error.errorArray);
    }
    return res.status(500).send(error.toString());
  }
});

// DELETE request to delete User.
router.delete('/users/me', auth, async (req: any, res: Response) => {
  try {
    await req.user.remove();
    return res.status(200).send();
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// PATCH request to update User.
router.patch('/users/me/password', auth, async (req: any, res: Response) => {
  try {
    parameterChecker(req, ['currentPassword', 'newPassword']);
    await User.verifyPassword(req.user, req.body.currentPassword);
    await User.verifyParameters(req);

    req.user.password = req.body.newPassword;
    await req.user.save();
    return res.status(200).send();
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).send(errorComposer(error));
    }
    if (error.name === 'ParameterError' || error.name === 'VerificationError') {
      return res.status(400).send(error.errorArray);
    }
    return res.status(500).send(error.toString());
  }
});

router.patch('/users/me/important', auth, async (req: any, res: Response) => {
  try {
    parameterChecker(req, ['password'], ['email', 'username']);
    await User.verifyPassword(req.user, req.body.password);
    await User.verifyParameters(req);

    const reqKeys = Object.keys(req.body);
    reqKeys.forEach((key) => {
      if (key !== 'password') req.user[key] = req.body[key];
    });
    await req.user.save();
    return res.status(200).send({
      full: req.user.toLimitedJSON(req.user, 0),
      auth: req.user.toLimitedJSON(req.user, 2),
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).send(errorComposer(error));
    }
    if (error.name === 'ParameterError' || error.name === 'VerificationError') {
      return res.status(400).send(error.errorArray);
    }
    return res.status(500).send(error.toString());
  }
});

router.patch('/users/me/regular', auth, async (req: any, res: Response) => {
  try {
    parameterChecker(
      req,
      [],
      ['displayName', 'bio', 'hideWhenMade', 'hidePosts']
    );
    await User.verifyParameters(req);

    const reqKeys = Object.keys(req.body);
    reqKeys.forEach((key) => (req.user[key] = req.body[key]));
    await req.user.save();
    return res.status(200).send(req.user.toLimitedJSON(req.user, 2));
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return res.status(400).send(errorComposer(error));
    }
    if (error.name === 'ParameterError' || error.name === 'VerificationError') {
      return res.status(400).send(error.errorArray);
    }
    return res.status(500).send(error.toString());
  }
});

export default router;
