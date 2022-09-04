import express, { Request, Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';

import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import { Post } from '../models/postsModel.js';
import { postMulter } from '../middleware/multer.js';
import ErrorAO from '../utils/ErrorAO.js';
import * as utils from '../utils/utils.js';

const router = express.Router();

/// POST ROUTES ///

// GET request for list of all Post items.
router.get('/posts', async (req: Request, res: Response) => {
  const posts = await Post.find({});
  return res.status(200).send(posts);
});

// GET request for one Post.
router.get('/posts/:id', async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (!post)
    throw new ErrorAO({ MAIN: ['No post by that ID'] }, 'ParameterError', 404);

  const fullPost = post.toCustomJSON();
  return res.status(200).send(fullPost);
});

// POST request for creating Post.
router.post('/posts', auth, postMulter, async (req: any, res: Response) => {
  const reqContent =
    typeof JSON.parse(req.body.jsoncontent) === 'string'
      ? JSON.parse(JSON.parse(req.body.jsoncontent))
      : JSON.parse(req.body.jsoncontent);
  utils.parameterChecker(
    reqContent,
    ['title'],
    ['content', 'mainPost', 'mentionedParents'],
    {
      isJSONString: true,
    }
  );


  const post = new Post({ ...reqContent, user: req.user._id });

  if (reqContent.mainPost) {
    const mainPost = await Post.findById(reqContent.mainPost);
    if (mainPost) post.mainPost = new mongoose.Types.ObjectId(mainPost._id);
  }

  const mentionedParents = reqContent.mentionedParents
    ? utils.filterDupes(reqContent.mentionedParents.slice())
    : [];
  for (const parentID of mentionedParents) {
    const parent = await Post.findById(parentID);
    if (parent)
      post.mentionedParents = post.mentionedParents.concat(parent._id);
  }

  if (Object.keys(req.files).length) {
    await utils.fileChecker(req, ['images', 'videos', 'datafiles']);

    const mediaType = Object.keys(req.files)[0];
    const filePath = path.join(utils.dirName(), `../../media/${mediaType}`);
    let mediaArray: string[] = [];

    for (let i = 0; i < req.files[mediaType].length; i++) {
      const filename = req.files[mediaType][i].filename;
      const meta = await fileTypeFromFile(req.files[mediaType][i].path);
      await fs.rename(
        `${filePath}/${filename}`,
        `${filePath}/${filename}.${meta.ext}`
      );
      mediaArray.push(`${filename}.${meta.ext}`);
    }

    post.media = mediaArray;
    post.mediaType = mediaType;
  }

  //await post.save();
  const fullPost = post.toCustomJSON();
  return res.status(200).send(fullPost);
});

// DELETE request to delete Post.
router.delete('/posts/:id', auth, async (req: any, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (!post)
    throw new ErrorAO({ MAIN: ['No post by that ID'] }, 'ParameterError', 404);
  if (!post.user._id.equals(req.user._id))
    throw new ErrorAO(
      { MAIN: ['You are not allowed to delete this post'] },
      'ParameterError',
      403
    );
  post.remove();
  return res.status(200).send();
});

// GET request to update Post.
router.patch(
  '/posts/:id',
  auth,
  postMulter,
  async (req: any, res: Response) => {
    const reqContent =
      typeof JSON.parse(req.body.jsoncontent) === 'string'
        ? JSON.parse(JSON.parse(req.body.jsoncontent))
        : JSON.parse(req.body.jsoncontent);

    utils.parameterChecker(
      reqContent,
      ['title'],
      ['content', 'mainPost', 'mentionedParents', 'filesToRemove'],
      {
        isJSONString: true,
      }
    );

    const post = await Post.findById(req.params.id);

    if (Object.keys(req.files).length)
      await utils.fileChecker(
        req,
        ['images', 'videos', 'datafiles'],
        {
          isPatch: true,
        },
        post
      );

    const mediaType = Object.keys(req.files)[0];
    const filePath = path.join(utils.dirName(), `../../media/${mediaType}`);
    let mediaArray: string[] = post.media;

    for (const flaggedFile in req.body?.filesToRemove) {
      if (!post?.media.includes(flaggedFile)) {
        throw new ErrorAO(
          {
            MAIN: [`Some of the files don't exist anymore`],
          },
          'ParameterError'
        );
      }
    }

    for (const flaggedFile in req.body?.filesToRemove) {
      await fs.unlink(`..\\..\\${mediaType}\\${flaggedFile}`);
      mediaArray.splice(mediaArray.indexOf(flaggedFile, 1));
    }

    for (let i = 0; i < req.files[mediaType].length; i++) {
      const filename = req.files[mediaType][i].filename;
      const meta = await fileTypeFromFile(req.files[mediaType][i].path);
      await fs.rename(
        `${filePath}/${filename}`,
        `${filePath}/${filename}.${meta.ext}`
      );
      mediaArray.push(`${filename}.${meta.ext}`);
    }

    post.title = req.body?.title;
    post.content = req.body?.content;
    post.edited = true;
    post.media = mediaArray;
    post.mediaType = mediaType;

    if (reqContent.mainPost) {
      const mainPost = await Post.findById(reqContent.mainPost);
      if (mainPost) post.mainPost = new mongoose.Types.ObjectId(mainPost._id);
    }

    const mentionedParents = reqContent.mentionedParents
      ? utils.filterDupes(reqContent.mentionedParents.slice())
      : [];
    for (const parentID of mentionedParents) {
      const parent = await Post.findById(parentID);
      if (parent)
        post.mentionedParents = post.mentionedParents.concat(parent._id);
    }

    await post.save();
    const fullPost = await post.toCustomJSON();
    return res.status(201).send(fullPost);
  }
);

export default router;
