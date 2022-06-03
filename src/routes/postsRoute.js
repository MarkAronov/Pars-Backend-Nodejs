import express from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import PostModel from '../models/postsModel.js';
import { filterDupes } from '../funcs/checkers.js';
import { parameterChecker } from '../funcs/checkers.js';
const router = express.Router();

// / POST ROUTES ///

// GET request for list of all Post items.
router.get('/posts', async (req, res) => {
  try {
    const posts = await PostModel.find({});
    return res.status(200).send(posts);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// GET request for one Post.
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).send();

    const fullPost = await post.toCustomJSON();
    res.status(200).send(fullPost);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// POST request for creating Post.
router.post('/posts', auth, async (req, res) => {
  try {
    parameterChecker(
      req,
      ['title', 'content'],
      ['mainPost', 'mentionedParents'],
      {
        needOneOptional: false,
      }
    );

    const post = new PostModel({ ...req.body, user: req.user._id });
    const mentionedParents = req.body.mentionedParents
      ? filterDupes(req.body.mentionedParents.slice())
      : [];

    if (req.body.mainPost) {
      const mainPost = await PostModel.findById(req.body.mainPost);
      if (!mainPost)
        return res
          .status(404)
          .send(`No main post by that ID: ${req.body.mainPost}`);
      post.mainPost = mainPost;
    }

    for (const parentID of mentionedParents) {
      const parent = await PostModel.findById(parentID);
      if (!parent)
        return res.status(404).send(`No parent by that ID: ${parentID}`);
      if (parent._id.equals(post._id))
        return res.status(400).send('You cannot reply to yourself');
    }
    for (const parentID of mentionedParents) {
      const parent = await PostModel.findById(parentID);
      post.mentionedParents = post.mentionedParents.concat(parent._id);
    }
    await post.save();
    const fullPost = await post.toCustomJSON();
    res.status(200).send(fullPost);
  } catch (err) {
    if (err.name === 'ParameterError' || err.name === 'VerificationError') {
      return res.status(400).send(err.arrayMessage);
    }
    res.status(500).send(err.toString());
  }
});

// DELETE request to delete Post.
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).send();
    if (!post.user._id.equals(req.user._id))
      return res.status(403).send('You are not allowed to delete this post');
    post.remove();
    res.status(200).send();
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

// GET request to update Post.
router.patch('/posts/:id', auth, async (req, res) => {
  parameterChecker(req, ['title', 'content'], ['mainPost', 'mentionedParents']);
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).send('No post by that ID');
    if (!post.user._id.equals(req.user._id))
      return res.status(403).send('You are not allowed to change this post');

    const currentParents = post.mentionedParents
      .slice()
      .map((value) => value._id.toString());
    const updatedParents = req.body.mentionedParents.slice();
    for (const currentParentID of currentParents) {
      const currentParent = await PostModel.findById(currentParentID);
      if (!currentParent) return res.status(404).send();
    }
    for (const updatedParentID of updatedParents) {
      const updatedParent = await PostModel.findById(updatedParentID);
      console.log(updatedParent);
      if (!updatedParent) return res.status(404).send();
      if (updatedParent.equals(post._id))
        return res.status(403).send('You cannot reply to yourself');
    }
    post.title = req.body?.title;
    post.content = req.body?.content;
    post.edited = true;
    for (const currParentId of post.mentionedParents) {
      if (updatedParents.indexOf(currParentId) === -1) {
        currentParents.splice(currentParents.indexOf(currParentId), 1);
      }
    }
    for (const newerParentId of updatedParents) {
      if (currentParents.indexOf(newerParentId) === -1) {
        currentParents.push(newerParentId);
      }
    }
    post.mentionedParents = currentParents.map((parent) =>
      mongoose.Types.ObjectId(parent)
    );
    await post.save();
    const fullPost = await post.toCustomJSON();
    res.status(201).send(fullPost);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

export default router;
