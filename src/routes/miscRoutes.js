import express from 'express';
import PostModel from '../models/postsModel.js';
import UserModel from '../models/usersModel.js';
const router = express.Router();
// 	OTHER NEEDED ROUTES

// GET request for finding posts/users
router.get('/search/', async function (req, res) {
  try {
    const post = await PostModel.find();
    const user = await UserModel.find();
    res.status(200).send(post, user);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

export default router;
