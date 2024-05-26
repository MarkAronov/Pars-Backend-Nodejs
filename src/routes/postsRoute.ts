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
import { PostType, Request } from 'src/utils/types.js';

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
    const post = new Post({ ...req.body, user: req?.user?._id }) as PostType;

    if (req.body.mentionedParents) {
      const mentionedParents = utils.filterDupes(
        req.body.mentionedParents.slice(),
      );

      for (const mentionedParent of mentionedParents) {
        post.mentionedParents = [];
        const parent = await Post.findById(mentionedParent);
        if (parent) post.mentionedParents.push(parent._id);
      }
    }

    if (req.files && Object.keys(req.files).length) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const mediaType = Object.keys(req.files)[0] as string;
      const mediaFiles = files[mediaType] as Express.Multer.File[];
      const mediaFolderPath = path.join(
        utils.dirName(),
        `..\\..\\media\\${mediaType}`,
      );
      const mediaArray: string[] = [];

      for (const file of mediaFiles) {
        const filename = file.filename;
        const meta = await fileTypeFromFile(file.path);
        await fs.rename(
          `${mediaFolderPath}\\${filename}`,
          `${mediaFolderPath}\\${filename}.${meta?.ext}`,
          () => {},
        );
        mediaArray.push(`${filename}.${meta?.ext}`);
      }

      post.media = mediaArray;
      post.mediaType = mediaType as string;
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
    const post = (await Post.findById(req.params['id'])) as PostType;
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
    const post = (await Post.findById(req.params['id'])) as PostType;
    let fullPost;
    if (post) {
      let mediaArray: string[] = post.media;
      const mediaFolderPath = path.join(utils.dirName(), '..\\..\\media\\');

      if (req.files && Object.keys(req.files).length) {
        if (post.mediaType) {
          const path = `${mediaFolderPath}\\${post.mediaType}\\`;
          for (const postFile of post.media) {
            console.log(`${path}\\${postFile}`);
            await fs.rm(`${path}\\${postFile}`, () => {});
          }
        }

        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const mediaType = Object.keys(req.files)[0] as string;
        const mediaFiles = files[mediaType] as Express.Multer.File[];
        mediaArray = [];
        for (const file of mediaFiles) {
          const filename = file.filename;
          const meta = await fileTypeFromFile(file.path);
          await fs.rename(
            `${mediaFolderPath}\\${mediaType}\\${filename}`,
            `${mediaFolderPath}\\${mediaType}\\${filename}.${meta?.ext}`,
            () => {},
          );
          mediaArray.push(`${filename}.${meta?.ext}`);
        }

        post.media = mediaArray;
        post.mediaType = mediaArray.length ? (mediaType as string) : null;
      }

      post.title = req.body.title || post.title;
      post.content = req.body.content || post.content;

      if (req.body.mentionedParents) {
        post.mentionedParents = [];
        const mentionedParents = utils.filterDupes(
          req.body.mentionedParents.slice(),
        );

        for (const mentionedParent of mentionedParents) {
          const parent = await Post.findById(mentionedParent);
          if (parent) post.mentionedParents.push(parent._id);
        }
      }

      if (req.body.filesToRemove) {
        const filesToRemove = post.mediaType
          ? post.media.slice()
          : utils.filterDupes(req.body.filesToRemove.slice());

        for (const fileToRemove of filesToRemove) {
          const filePath = `${mediaFolderPath}\\${post.mediaType}\\${fileToRemove}`;
          console.log(filePath);
          if (fs.existsSync(filePath)) {
            await fs.rm(filePath, () => {});
            mediaArray.splice(mediaArray.indexOf(fileToRemove), 1);
          }
        }
      }

      if (req.body) {
        post.edited = true;
      }
      await post?.save();
      fullPost = await post.toCustomJSON();
    }
    return res.status(200).send(fullPost);
  }),
);

// DELETE request to delete Post.
router.delete(
  '/posts/:id',
  auth,
  parameterChecker,
  utils.wrap(async (req: Request, res: Response) => {
    const post = await Post.findById(req.params['id']);
    await post?.deleteOne();
    return res.status(200).send();
  }),
);

export default router;
