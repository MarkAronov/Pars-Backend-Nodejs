import express, { Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

import { Post } from '../models/postsModel.js';
import { User } from '../models/usersModel.js';
import { Request, UserType, PostType } from '../types/index.js';
import { dirName, wrap } from '../utils/index.js';

export const miscRoutes = express.Router();
/// OTHER NEEDED ROUTES ///
// GET request for finding posts/users
miscRoutes.get('/search', async (req, res) => {
  const results: { users: UserType[]; posts: PostType[] } = {
    users: [],
    posts: [],
  };
  if (req.query?.['q']) {
    const query = req.query['q'].toString();
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

miscRoutes.get(
  '/media/:mediatype/:mediafile',
  wrap(async (req: Request, res: Response) => {
    const filePath = path.join(
      dirName(),
      `..\\..\\media\\${req.params['mediatype']}\\${req.params['mediafile']}`,
    );
    const meta = await fileTypeFromFile(filePath);
    if (meta?.ext === 'mp4') {
      return res.status(200).sendFile(filePath);
    } else {
      return res.status(200).sendFile(filePath);
    }
  }),
);
