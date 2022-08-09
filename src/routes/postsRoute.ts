import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import { Post } from '../models/postsModel.js';
import { postMulter } from '../middleware/multer.js';
import { filterDupes, parameterChecker, dirName } from '../utils/utils.js';

const router = express.Router();

// / POST ROUTES ///

// GET request for list of all Post items.
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const posts = await Post.find({});
    return res.status(200).send(posts);
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// GET request for one Post.
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send();

    const fullPost = await post.toCustomJSON();
    return res.status(200).send(fullPost);
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// POST request for creating Post.
router.post(
  '/posts',
  auth,
  postMulter,
  async (req: any, res: Response) => {
    console.log(req.body, req.files, Object.keys(req));
    // parameterChecker(req);
    // if (mediaType !== 'avatar' && mediaType !== 'backgroundImage') {
    //   return res
    //     .status(400)
    //     .send('Either upload an avatar or a background image');
    // }
    // if (req.files !== undefined) {
    //   const whiteListedTypes = ['png', 'jpg', 'gif'];
    //   const filePath = path.join(dirName(), `../../media/${mediaType}s`);
    //   const filename = req.files[mediaType][0].filename;
    //   const meta = await fileTypeFromFile(req.files[mediaType][0].path);

    //   if (meta === undefined || !whiteListedTypes.includes(meta.ext)) {
    //     await fs.unlink(`${filePath}/${filename}`);
    //     return res
    //       .status(400)
    //       .send('The only formats allowed are PNG, JPG and GIF');
    //   }
    //   const fullName = `${filename}.${meta.ext}`;

    //   try {
    //     if (req.user[mediaType]) {
    //       await fs.unlink(`${filePath}/${req.user[mediaType]}`);
    //     }
    //   } catch (error) {}
    //   await fs.rename(`${filePath}/${filename}`, `${filePath}/${fullName}`);
    //   req.user[mediaType] = fullName;
    //   await req.user.save();
    //   return res.status(200).send(fullName);
    // } else return res.status(400).send();

    // const post = new Post({ ...req.body, user: req.user._id });
    // const mentionedParents = req.body.mentionedParents
    //   ? filterDupes(req.body.mentionedParents.slice())
    //   : [];

    // if (req.body.mainPost) {
    //   const mainPost = await Post.findById(req.body.mainPost);
    //   if (!mainPost)
    //     return res
    //       .status(404)
    //       .send(`No main post by that ID: ${req.body.mainPost}`);
    //   post.mainPost = new mongoose.Types.ObjectId(mainPost._id);
    // }

    // for (const parentID of mentionedParents) {
    //   const parent = await Post.findById(parentID);
    //   if (!parent)
    //     return res.status(404).send(`No parent by that ID: ${parentID}`);
    //   if (parent._id.equals(post._id))
    //     return res.status(400).send('You cannot reply to yourself');
    // }
    // for (const parentID of mentionedParents) {
    //   const parent = await Post.findById(parentID);
    //   post.mentionedParents = post.mentionedParents.concat(parent._id);
    // }
    // await post.save();
    // const fullPost = await post.toCustomJSON();
    // return res.status(200).send(fullPost);
    return res.status(200).send();
  },
  (error: any, _req: Request, res: Response) => {
    if (error.name === 'ParameterError' || error.name === 'VerificationError') {
      return res.status(400).send(error.errorArray);
    }
    return res.status(500).send(error.toString());
  }
);

// DELETE request to delete Post.
router.delete('/posts/:id', auth, async (req: any, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send();
    if (!post.user._id.equals(req.user._id))
      return res.status(403).send('You are not allowed to delete this post');
    post.remove();
    return res.status(200).send();
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

// GET request to update Post.
router.patch('/posts/:id', auth, async (req: any, res: Response) => {
  parameterChecker(req, ['title', 'content'], ['mainPost', 'mentionedParents']);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('No post by that ID');
    if (!post.user._id.equals(req.user._id))
      return res.status(403).send('You are not allowed to change this post');

    const currentParents = post.mentionedParents
      .slice()
      .map((value) => value._id.toString());
    const updatedParents = req.body.mentionedParents.slice();
    for (const currentParentID of currentParents) {
      const currentParent = await Post.findById(currentParentID);
      if (!currentParent) return res.status(404).send();
    }
    for (const updatedParentID of updatedParents) {
      const updatedParent = await Post.findById(updatedParentID);
      if (!updatedParent) return res.status(404).send();
      if (updatedParent.equals(post._id))
        return res.status(403).send('You cannot reply to yourself');
    }
    post.title = req.body?.title;
    post.content = req.body?.content;
    post.edited = true;
    for (const currParentId of post.mentionedParents) {
      if (updatedParents.indexOf(currParentId) === -1) {
        currentParents.splice(
          currentParents.indexOf(currParentId.toString()),
          1
        );
      }
    }
    for (const newerParentId of updatedParents) {
      if (currentParents.indexOf(newerParentId) === -1) {
        currentParents.push(newerParentId);
      }
    }
    post.mentionedParents = currentParents.map(
      (parent: string) => new mongoose.Types.ObjectId(parent)
    );
    await post.save();
    const fullPost = await post.toCustomJSON();
    return res.status(201).send(fullPost);
  } catch (error: any) {
    return res.status(500).send(error.toString());
  }
});

export default router;
