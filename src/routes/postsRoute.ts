import express, { Request, Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs';
import mongoose from 'mongoose';

import { Post } from '../models/postsModel.js';

import auth from '../middleware/auth.js';
import jsonParser from '../middleware/jsonParser.js';
import { postMulter } from '../middleware/multer.js';
import parameterChecker from '../middleware/parameterChecker.js';

import ErrorAO from '../utils/ErrorAO.js';
import * as utils from '../utils/utils.js';

const router = express.Router();

/// POST ROUTES ///

// GET request for list of all Post items.
router.get(
  '/posts',
  utils.wrap(async (req: Request, res: Response) => {
    const posts = await Post.find({});
    return res.status(200).send(posts);
  })
);

// GET request for one Post.
router.get(
  '/posts/:id',
  utils.wrap(async (req: Request, res: Response) => {
    const post = await Post.findById(req.params.id);
    if (!post)
      throw new ErrorAO(
        { MAIN: [`No post by that ID: ${req.params.id}`] },
        'ParameterError',
        404
      );

    const fullPost = post.toCustomJSON();
    return res.status(200).send(fullPost);
  })
);

// POST request for creating Post.
router.post(
  '/posts',
  auth,
  postMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: any, res: Response) => {
    const post = new Post({ ...req.body, user: req.user._id });

    if (req.body.mainPost) {
      const mainPost = await Post.findById(req.body.mainPost);
      if (mainPost) post.mainPost = new mongoose.Types.ObjectId(mainPost._id);
    }

    const mentionedParents = req.body.mentionedParents
      ? utils.filterDupes(req.body.mentionedParents.slice())
      : [];
    for (const parentID of mentionedParents) {
      const parent = await Post.findById(parentID);
      if (parent)
        post.mentionedParents = post.mentionedParents.concat(parent._id);
    }

    if (Object.keys(req.files).length) {
      const mediaType = Object.keys(req.files)[0];
      const fileFolderPath = path.join(
        utils.dirName(),
        `../../media/${mediaType}`
      );
      let mediaArray: string[] = [];

      for (let i = 0; i < req.files[mediaType].length; i++) {
        const filename = req.files[mediaType][i].filename;
        const meta = await fileTypeFromFile(req.files[mediaType][i].path);
        await fs.rename(
          `${fileFolderPath}/${filename}`,
          `${fileFolderPath}/${filename}.${meta.ext}`,
          () => {}
        );
        mediaArray.push(`${filename}.${meta.ext}`);
      }

      post.media = mediaArray;
      post.mediaType = mediaType;
    }

    await post.save();
    const fullPost = await post.toCustomJSON();
    return res.status(200).send(fullPost);
  })
);

// DELETE request to delete Post.
router.delete(
  '/posts/:id',
  auth,
  parameterChecker,
  utils.wrap(async (req: any, res: Response) => {
    const post = await Post.findById(req.params.id);

    post.remove();
    return res.status(200).send();
  })
);

// GET request to update Post.
router.patch(
  '/posts/:id',
  auth,
  postMulter,
  jsonParser,
  parameterChecker,
  utils.wrap(async (req: any, res: Response) => {
    const post = await Post.findById(req.params.id);
    const mediaType = Object.keys(req.files)[0];
    const mediaFolderPath = path.join(utils.dirName(), '../../media/');

    let mediaArray: string[] = post.media;

    const filesToRemove = req.body.mentionedParents
      ? utils.filterDupes(req.body.mentionedParents.slice())
      : [];
    for (const flaggedFile in filesToRemove) {
      const filePath = `${mediaFolderPath}/${post.mediaType}/${flaggedFile}`;
      if (fs.existsSync(filePath)) fs.rm(filePath, () => {});
      mediaArray.splice(mediaArray.indexOf(flaggedFile), 1);
    }

    for (let i = 0; i < req.files[mediaType].length; i++) {
      const filename = req.files[mediaType][i].filename;
      const meta = await fileTypeFromFile(req.files[mediaType][i].path);
      await fs.rename(
        `${mediaFolderPath}/${mediaType}/${filename}`,
        `${mediaFolderPath}/${mediaType}/${filename}.${meta.ext}`,
        () => {}
      );
      mediaArray.push(`${filename}.${meta.ext}`);
    }

    post.media = mediaArray;
    post.mediaType = mediaType;

    post.title = req.body?.title;
    post.content = req.body?.content;
    post.edited = true;

    if (req.body.mainPost) {
      const mainPost = await Post.findById(req.body.mainPost);
      if (mainPost) post.mainPost = new mongoose.Types.ObjectId(mainPost._id);
    }

    const mentionedParents = req.body.mentionedParents
      ? utils.filterDupes(req.body.mentionedParents.slice())
      : [];
    for (const parentID of mentionedParents) {
      const parent = await Post.findById(parentID);
      if (parent)
        post.mentionedParents = post.mentionedParents.concat(parent._id);
    }

    await post.save();
    const fullPost = await post.toCustomJSON();
    return res.status(201).send(fullPost);
  })
);

export default router;
