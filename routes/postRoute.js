const express = require('express');
const router = express.Router();
const PostModel = require('../models/postModel');
const UserModel = require('../models/userModel');

/// POST ROUTES ///

// GET request for list of all Post items.
router.get('/all', async function (req, res) {
    try {
        const posts = await PostModel.find({});
        return res.status(200).send(posts);
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

// POST request for creating Post.
router.post('/create', async function (req, res) {
    const newPost = new PostModel(req.body);
    try {
        const user = await UserModel.findById(req.body._user_id);
        if (!user) return res.status(404).send("no user by that id: " + req.body._user_id);
        await user.save()
        for (var i = 0; i < req.body._parents_ids.length; i++) {
            var post_id = req.body._parents_ids[i]
            const parent = await PostModel.findById(post_id);
            if (!parent) return res.status(404).send("No parent by that id: " + post_id);
            newPost._parents = newPost._parents.concat(parent)
        }
        await newPost.save()
        for (var i = 0; i < req.body._parents_ids.length; i++) {
            var post_id = req.body._parents_ids[i]
            const parent = await PostModel.findById(post_id);
            parent._children = parent._children.concat(newPost)
            await parent.save()
        }
        newPost._user = user
        user._posts = (!user._posts.length) ? [newPost] : user._posts.concat(newPost);
        res.status(201).send(newPost);
    }
    catch (e) {
        console.log(e)
        res.status(400).send(e.toString())
    }
});

// DELETE request to delete Post.
router.delete('/delete/:id', async function (req, res) {
    res.send('NOT IMPLEMENTED: Post delete');
});

// GET request to update Post.
router.patch('/update/:id', async function (req, res) {
    res.send('NOT IMPLEMENTED: Post update');
});

// GET request for one Post.
router.get('/:id', async function (req, res) {
    try {
        const post = await PostModel.findById(req.params.id);
        if (!post) return res.status(404).send();
        res.status(200).send(post);
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString());
    }
});


module.exports = router;