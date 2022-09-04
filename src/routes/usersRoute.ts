import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

import auth from '../middleware/auth.js';
import { User } from '../models/usersModel.js';
import { userMulter } from '../middleware/multer.js';
import * as utils from '../utils/utils.js';

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
    if (req.files) {
      const whiteListedTypes = ['png', 'jpg', 'gif'];
      const filePath = path.join(utils.dirName(), `../../media/${mediaType}s`);
      const filename = req.files[mediaType][0].filename;
      const meta = await fileTypeFromFile(req.files[mediaType][0].path);

      if (!meta || !whiteListedTypes.includes(meta.ext)) {
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
  }
);

router.get('/users/:username/:mediatype', async (req, res) => {
  const mediaType = req.params.mediatype;
  if (mediaType !== 'avatar' && mediaType !== 'backgroundImage')
    return res.status(400).send();
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).send();
  if (user[mediaType]) {
    const filePath = path.join(
      utils.dirName(),
      `../../media/${mediaType}s/${user[mediaType]}`
    );
    return res.status(200).sendFile(filePath);
  } else {
    return res.status(404).send();
  }
});

router.delete('/users/me/:mediatype', auth, async (req: any, res: Response) => {
  const mediaType = req.params.mediatype;
  if (mediaType !== 'avatar' && mediaType !== 'backgroundImage')
    return res.status(400).send();
  if (req.user.avatar && mediaType === 'avatar') {
    await fs.unlink(
      path.join(utils.dirName(), `../../media/${mediaType}s/${req.user.avatar}`)
    );
    req.user.avatar = null;
    await req.user.save();
  }
  if (req.user.backgroundImage && mediaType === 'backgroundImage') {
    await fs.unlink(
      path.join(
        utils.dirName(),
        `../../media/${mediaType}s/${req.user.backgroundImage}`
      )
    );
    req.user.backgroundImage = null;
    await req.user.save();
  }
  return res.status(200).send();
});

// / USER ROUTES ///

// GET request for list of all Users.
router.get('/users/', async (req, res) => {
  const users = await User.find({});
  return res.status(200).send(users);
});

// GET request for one User.
router.get('/users/:username', async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).send();

  if (!user.settings.hidePosts) {
    await user.populate('posts');
  }
  // if(user.settings)
  return res.status(200).send(user.toLimitedJSON(2));
});

// POST request for logging the user in.
router.post('/users/login', async (req, res) => {
  utils.parameterChecker(req, ['email', 'password']);

  const userToLimit = await User.verifyCredentials(
    req.body.email,
    req.body.password
  );
  const token = await userToLimit.generateToken(userToLimit);
  const user = userToLimit.toLimitedJSON(userToLimit, 2);
  return res.status(200).send({ user, token });
});

// POST request for logging the user out.
router.post('/users/logout', auth, async (req: any, res: Response) => {
  req.user.tokens = req.user.tokens.filter((token: any) => {
    return token.token !== req.token;
  });
  await req.user.save();
  return res.status(200).send();
});

// POST request for logging the user out from all sessions.
router.post('/users/logoutall', auth, async (req: any, res: Response) => {
  req.user.tokens = [];
  await req.user.save();
  return res.status(200).send();
});

// POST request for creating User.
router.post('/users', async (req: Request, res: Response) => {
  utils.parameterChecker(req, ['email', 'username', 'password']);

  const userData = req.body;
  userData.displayName = userData.username;
  const createdUser = new User(userData);
  await createdUser.save();

  const user = createdUser.toLimitedJSON(2);
  const token = await createdUser.generateToken();

  return res.status(201).send({ user, token });
});

// DELETE request to delete User.
router.delete('/users/me', auth, async (req: any, res: Response) => {
  await req.user.remove();
  return res.status(200).send();
});

// PATCH request to update User.
router.patch('/users/me/password', auth, async (req: any, res: Response) => {
  utils.parameterChecker(req, ['currentPassword', 'newPassword'], [],{
    userCheck: true,
  });
  await User.verifyPassword(req.user, req.body.currentPassword);

  req.user.password = req.body.newPassword;
  await req.user.save();
  return res.status(200).send();
});

router.patch('/users/me/important', auth, async (req: any, res: Response) => {
  utils.parameterChecker(req, ['password'], ['email', 'username'], {
    userCheck: true,
  });
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
});

router.patch('/users/me/regular', auth, async (req: any, res: Response) => {
  utils.parameterChecker(
    req,
    [],
    ['displayName', 'bio', 'hideWhenMade', 'hidePosts'],
    { userCheck: true }
  );

  const reqKeys = Object.keys(req.body);
  reqKeys.forEach((key) => (req.user[key] = req.body[key]));
  await req.user.save();
  return res.status(200).send(req.user.toLimitedJSON(req.user, 2));
});

export default router;
