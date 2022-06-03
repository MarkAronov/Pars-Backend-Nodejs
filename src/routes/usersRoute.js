import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

import UserModel from '../models/usersModel.js';
import auth from '../middleware/auth.js';
import { userMulter } from '../middleware/multer.js';
import errorComposer from '../funcs/errorComposer.js';
import { parameterChecker } from '../funcs/checkers.js';
import dirName from '../funcs/dirName.js';

const router = express.Router();

router.post(
  '/users/me/:mediatype',
  auth,
  userMulter,
  async (req, res) => {
    const mediaType = req.params.mediatype;
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
      } catch (err) {}
      await fs.rename(`${filePath}/${filename}`, `${filePath}/${fullName}`);
      req.user[mediaType] = fullName;
      await req.user.save();
      return res.status(200).send(fullName);
    } else return res.status(400).send();
  },
  (error, req, res, next) => {
    return res.status(400).send(error.message);
  }
);

router.get('/users/:username/:mediatype', async (req, res) => {
  try {
    const mediaType = req.params.mediatype;
    if (mediaType !== 'avatar' && mediaType !== 'backgroundImage')
      return res.status(400).send();
    const user = await UserModel.findOne({ username: req.params.username });
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
  } catch (err) {
    return res.status(500).send(err.toString());
  }
});

router.delete('/users/me/:mediatype', auth, async (req, res) => {
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
  } catch (err) {
    return res.status(500).send(err.toString());
  }
});

// / USER ROUTES ///

// GET request for list of all Users.
router.get('/users/', async (req, res) => {
  try {
    const users = await UserModel.find({});
    return res.status(200).send(users);
  } catch (err) {
    return res.status(500).send(err.toString());
  }
});

// GET request for one User.
router.get('/users/:username', async (req, res) => {
  try {
    const user = await UserModel.findOne({ username: req.params.username });
    if (!user) return res.status(404).send();

    if (!user.settings.hidePosts) {
      await user.populate('posts');
    }

    return res.status(200).send(user.toLimitedJSON(2));
  } catch (err) {
    return res.status(500).send(err.toString());
  }
});

// POST request for logging the user in.
router.post('/users/login', async (req, res) => {
  try {
    parameterChecker(req, ['email', 'password']);

    const userToLimit = await UserModel.verifyCredentials(
      req.body.email,
      req.body.password
    );
    const token = await userToLimit.generateToken();
    const user = userToLimit.toLimitedJSON(2);
    return res.status(200).send({ user, token });
  } catch (err) {
    if (err.name === 'VerificationError') {
      return res.status(400).send(err.arrayMessage);
    }
    if (err.name === 'ParameterError' || err.name === 'VerificationError') {
      return res.status(400).send(err.arrayMessage);
    }
    return res.status(500).send(err.toString());
  }
});

// POST request for logging the user out.
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    return res.status(200).send();
  } catch (err) {
    return res.status(500).send(err.toString());
  }
});

// POST request for logging the user out from all sessions.
router.post('/users/logoutall', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    return res.status(200).send();
  } catch (err) {
    return res.status(500).send(err.toString());
  }
});

// POST request for creating User.
router.post('/users', async (req, res) => {
  try {
    parameterChecker(req, ['email', 'username', 'password']);

    const userData = req.body;
    userData.displayName = userData.username;
    const createdUser = new UserModel(userData);
    await createdUser.save();

    const user = createdUser.toLimitedJSON(2);
    const token = await createdUser.generateToken();

    return res.status(201).send({ user, token });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).send(errorComposer(err));
    }
    if (err.name === 'ParameterError' || err.name === 'VerificationError') {
      return res.status(400).send(err.arrayMessage);
    }
    return res.status(500).send();
  }
});

// DELETE request to delete User.
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    return res.status(200).send();
  } catch (err) {
    return res.status(500).send(err.toString());
  }
});

// PATCH request to update User.
router.patch('/users/me/password', auth, async (req, res) => {
  try {
    parameterChecker(req, ['currentPassword', 'newPassword']);
    await UserModel.verifyPassword(req.user, req.body.currentPassword);
    await UserModel.verifyParameters(req);

    req.user.password = req.body.newPassword;
    await req.user.save();
    return res.status(200).send();
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).send(errorComposer(err));
    }
    if (err.name === 'ParameterError' || err.name === 'VerificationError') {
      return res.status(400).send(err.arrayMessage);
    }
    return res.status(500).send(err.toString());
  }
});

router.patch('/users/me/important', auth, async (req, res) => {
  try {
    parameterChecker(req, ['password'], ['email', 'username']);
    await UserModel.verifyPassword(req.user, req.body.password);
    await UserModel.verifyParameters(req);

    const reqKeys = Object.keys(req.body);
    reqKeys.forEach((key) => {
      if (key !== 'password') req.user[key] = req.body[key];
    });
    await req.user.save();
    return res.status(200).send({
      full: req.user.toLimitedJSON(0),
      auth: req.user.toLimitedJSON(2),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).send(errorComposer(err));
    }
    if (err.name === 'ParameterError' || err.name === 'VerificationError') {
      return res.status(400).send(err.arrayMessage);
    }
    return res.status(500).send(err.toString());
  }
});

router.patch('/users/me/regular', auth, async (req, res) => {
  try {
    parameterChecker(
      req,
      [],
      ['displayName', 'bio', 'hideWhenMade', 'hidePosts']
    );
    await UserModel.verifyParameters(req);

    const reqKeys = Object.keys(req.body);
    reqKeys.forEach((key) => (req.user[key] = req.body[key]));
    await req.user.save();
    return res.status(200).send(req.user.toLimitedJSON(2));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).send(errorComposer(err));
    }
    if (err.name === 'ParameterError' || err.name === 'VerificationError') {
      return res.status(400).send(err.arrayMessage);
    }
    return res.status(500).send(err.toString());
  }
});

export default router;
