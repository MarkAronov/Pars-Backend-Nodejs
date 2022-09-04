import express from 'express';
import { Post } from '../models/postsModel.js';
import { User } from '../models/usersModel.js';
const router = express.Router();
// 	OTHER NEEDED ROUTES

// GET request for finding posts/users
router.get('/search/', async function (req, res) {

    const post = await Post.find();
    const user = await User.find();
    res.status(200).send({ post, user });

});

export default router;
