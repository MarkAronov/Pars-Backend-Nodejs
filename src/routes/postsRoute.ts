/* eslint-disable @typescript-eslint/no-empty-function */

// Import necessary modules and dependencies
import express, { Response } from 'express';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs';

import { Post } from '../models/postsModel.js';
import auth from '../middleware/auth.js';
import jsonParser from '../middleware/jsonParser.js';
import { postMulter } from '../middleware/multer.js';
import parameterChecker from '../middleware/parameterChecker.js';
import { PostType, Request } from '../types/index.js';
import { dirName, filterDupes, wrap } from '../utils/index.js';

// Create a new express router
const router = express.Router();

/// POST ROUTES ///

// POST request for creating a new Post.
router.post(
  '/posts',
  auth, // Middleware for authentication
  postMulter, // Middleware for handling file uploads
  jsonParser, // Middleware for parsing JSON data
  parameterChecker, // Middleware for checking parameters
  wrap(async (req: Request, res: Response) => {
    // Create a new Post instance with the request body and user ID
    const post = new Post({ ...req.body, user: req?.user?._id }) as PostType;

    // Handle mentioned parents
    if (req.body.mentionedParents) {
      const mentionedParents = filterDupes(req.body.mentionedParents.slice());
      for (const mentionedParent of mentionedParents) {
        post.mentionedParents = [];
        const parent = await Post.findById(mentionedParent);
        if (parent) post.mentionedParents.push(parent._id);
      }
    }

    // Handle file uploads
    if (req.files && Object.keys(req.files).length) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const mediaType = Object.keys(req.files)[0] as string;
      const mediaFiles = files[mediaType] as Express.Multer.File[];
      const mediaFolderPath = path.join(
        dirName(),
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

    // Save the post and return the full post data
    await post.save();
    const fullPost = await post.toCustomJSON();
    return res.status(200).send(fullPost);
  }),
);

// GET request for list of all Post items.
router.get(
  '/posts',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  wrap(async (req: Request, res: Response) => {
    // Fetch all posts from the database
    const posts = await Post.find({});
    return res.status(200).send(posts);
  }),
);

// GET request for a specific Post by ID.
router.get(
  '/posts/:id',
  wrap(async (req: Request, res: Response) => {
    // Fetch the post by ID and return the full post data
    const post = (await Post.findById(req.params['id'])) as PostType;
    const fullPost = await post.toCustomJSON();
    return res.status(201).send(fullPost);
  }),
);

// PATCH request to update a Post by ID.
router.patch(
  '/posts/:id',
  auth, // Middleware for authentication
  postMulter, // Middleware for handling file uploads
  jsonParser, // Middleware for parsing JSON data
  parameterChecker, // Middleware for checking parameters
  wrap(async (req: Request, res: Response) => {
    // Fetch the post by ID and update its fields
    const post = (await Post.findById(req.params['id'])) as PostType;
    let fullPost;
    if (post) {
      let mediaArray: string[] = post.media;
      const mediaFolderPath = path.join(dirName(), '..\\..\\media\\');

      // Handle new file uploads and remove old files if necessary
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

      // Update the post's title and content
      post.title = req.body.title || post.title;
      post.content = req.body.content || post.content;

      // Update mentioned parents
      if (req.body.mentionedParents) {
        post.mentionedParents = [];
        const mentionedParents = filterDupes(req.body.mentionedParents.slice());
        for (const mentionedParent of mentionedParents) {
          const parent = await Post.findById(mentionedParent);
          if (parent) post.mentionedParents.push(parent._id);
        }
      }

      // Handle files to be removed
      if (req.body.filesToRemove) {
        const filesToRemove = post.mediaType
          ? post.media.slice()
          : filterDupes(req.body.filesToRemove.slice());
        for (const fileToRemove of filesToRemove) {
          const filePath = `${mediaFolderPath}\\${post.mediaType}\\${fileToRemove}`;
          console.log(filePath);
          if (fs.existsSync(filePath)) {
            await fs.rm(filePath, () => {});
            mediaArray.splice(mediaArray.indexOf(fileToRemove), 1);
          }
        }
      }

      // Mark the post as edited if there are changes
      if (req.body) {
        post.edited = true;
      }
      await post?.save();
      fullPost = await post.toCustomJSON();
    }
    return res.status(200).send(fullPost);
  }),
);

// DELETE request to delete a Post by ID.
router.delete(
  '/posts/:id',
  auth, // Middleware for authentication
  parameterChecker, // Middleware for checking parameters
  wrap(async (req: Request, res: Response) => {
    // Find the post by ID and delete it
    const post = await Post.findById(req.params['id']);
    await post?.deleteOne();
    return res.status(200).send();
  }),
);

export default router;
