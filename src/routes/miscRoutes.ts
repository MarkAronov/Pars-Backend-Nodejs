import express from 'express';
import path from 'path';

import { Post } from '../models/postsModel.js';
import { User } from '../models/usersModel.js';

import * as utils from '../utils/utils.js';

const router = express.Router();

/// OTHER NEEDED ROUTES ///

// GET request for finding posts/users
router.get('/search/', async function (req, res) {
  const post = await Post.find();
  const user = await User.find();
  return res.status(200).send({ post, user });
});

router.get('/media/:mediatype/:mediafile', async function (req, res) {
  const filePath = path.join(
    utils.dirName(),
    `..\\..\\media\\${req.params.mediatype}\\${req.params.mediafile}`
  );
  return res.status(200).sendFile(filePath);
});

export default router;
