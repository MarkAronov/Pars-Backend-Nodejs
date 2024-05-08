/* eslint-disable @typescript-eslint/no-empty-function */
import express, { Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs';

import { Post } from '../models/postsModel.js';

import auth from '../middleware/auth.js';
import jsonParser from '../middleware/jsonParser.js';
import { postMulter } from '../middleware/multer.js';
import parameterChecker from '../middleware/parameterChecker.js';
import { Request } from 'src/utils/types.js';

import * as utils from '../utils/utils.js';

const router = express.Router();

/// POST ROUTES ///

// POST request for creating Post.
router.post(
  '/posts',
  auth,
  postMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const post = new Post({ ...req.body, user: req.user._id });

    if (req.body.mentionedParents) {
      const mentionedParents = utils.filterDupes(
        req.body.mentionedParents.slice(),
      );

      for (let i = 0; i < mentionedParents.length; i++) {
        post.mentionedParents = [];
        const parent = await Post.findById(mentionedParents[i]);
        if (parent) post.mentionedParents.push(parent._id);
      }
    }

    if (Object.keys(req.files).length) {
      const mediaType = Object.keys(req.files)[0];

      const fileFolderPath = path.join(
        utils.dirName(),
        `..\\..\\media\\${mediaType}`,
      );
      const mediaArray: string[] = [];

      for (let i = 0; i < req.files[mediaType].length; i++) {
        const filename = req.files[mediaType][i].filename;
        const meta = await fileTypeFromFile(req.files[mediaType][i].path);
        await fs.rename(
          `${fileFolderPath}\\${filename}`,
          `${fileFolderPath}\\${filename}.${meta.ext}`,
          () => {},
        );
        mediaArray.push(`${filename}.${meta.ext}`);
      }

      post.media = mediaArray;
      post.mediaType = mediaType;
    }

    await post.save();
    const fullPost = await post.toCustomJSON();
    return res.status(200).send(fullPost);
  }),
);

// GET request for list of all Post items.
router.get(
  '/posts',
  utils.wrap(async (req: Request, res: Response) => {
    const posts = await Post.find({});
    return res.status(200).send(posts);
  }),
);

// GET request for one Post.
router.get(
  '/posts/:id',
  utils.wrap(async (req: Request, res: Response) => {
    const post = await Post.findById(req.params.id);
    const fullPost = await post.toCustomJSON();
    return res.status(201).send(fullPost);
  }),
);

// GET request to update Post.
router.patch(
  '/posts/:id',
  auth,
  postMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const post = await Post.findById(req.params.id);
    const mediaType = Object.keys(req.files)[0];
    const mediaFolderPath = path.join(utils.dirName(), '..\\..\\media\\');

    let mediaArray: string[] = post.media;

    if (Object.keys(req.files).length) {
      mediaArray = [];
      for (let i = 0; i < req.files[mediaType].length; i++) {
        const filename = req.files[mediaType][i].filename;
        const meta = await fileTypeFromFile(req.files[mediaType][i].path);
        await fs.rename(
          `${mediaFolderPath}\\${mediaType}\\${filename}`,
          `${mediaFolderPath}\\${mediaType}\\${filename}.${meta.ext}`,
          () => {},
        );
        mediaArray.push(`${filename}.${meta.ext}`);
      }
    }
    post.title = req.body.title ? req.body.title : post.title;
    post.content = req.body.content ? req.body.content : post.content;

    if (req.body.mentionedParents) {
      post.mentionedParents = [];
      const mentionedParents = utils.filterDupes(
        req.body.mentionedParents.slice(),
      );

      for (let i = 0; i < mentionedParents.length; i++) {
        const parent = await Post.findById(mentionedParents[i]);
        if (parent) post.mentionedParents.push(parent._id);
      }
    }

    if (req.body.filesToRemove) {
      const filesToRemove = post.mediaType
        ? post.media.slice()
        : utils.filterDupes(req.body.filesToRemove.slice());

      for (let i = 0; i < filesToRemove.length; i++) {
        const filePath = `${mediaFolderPath}\\${post.mediaType}\\${filesToRemove[i]}`;
        if (fs.existsSync(filePath)) {
          fs.rm(filePath, () => {});
          mediaArray.splice(mediaArray.indexOf(filesToRemove[i]), 1);
        }
      }
    }

    post.media = mediaArray;
    post.mediaType = mediaArray.length ? mediaType : null;

    if (req.body) {
      post.edited = true;
    }
    await post.save();
    const fullPost = await post.toCustomJSON();
    return res.status(200).send(fullPost);
  }),
);

// DELETE request to delete Post.
router.delete(
  '/posts/:id',
  auth,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const post = await Post.findById(req.params.id);
    await post.deleteOne();
    return res.status(200).send();
  }),
);

export default router;
