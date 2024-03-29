import express, { Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

import { Post } from '../models/postsModel.js';
import { User } from '../models/usersModel.js';

import * as utils from '../utils/utils.js';
import { Request } from 'src/utils/types.js';

const router = express.Router();

/// OTHER NEEDED ROUTES ///
// GET request for finding posts/users
router.get('/search', async (req, res) => {
  const results = { users: null, posts: null };
  if (req.query?.q) {
    const query = req.query.q.toString();
    console.log(query);
    results.users = await User.aggregate([
      {
        $search: {
          text: {
            query: [query],
            path: ['username', 'displayName'],
            fuzzy: {
              maxEdits: 2,
              prefixLength: 3,
            },
          },
        },
      },
    ]);
    results.posts = await Post.aggregate([
      {
        $search: {
          text: {
            query: [query],
            path: ['title'],
            fuzzy: {
              maxEdits: 2,
              prefixLength: 1,
            },
          },
        },
      },
    ]);
    console.log(results);
  }
  return res.status(200).send(results);
});

router.get(
  '/media/:mediatype/:mediafile',
  utils.wrap(async (req: Request, res: Response) => {
    const filePath = path.join(
      utils.dirName(),
      `..\\..\\media\\${req.params.mediatype}\\${req.params.mediafile}`,
    );
    const meta = await fileTypeFromFile(filePath);
    if (meta.ext === 'mp4') {
      return res.status(200).sendFile(filePath);
    } else {
      return res.status(200).sendFile(filePath);
    }
  }),
);

export default router;
