const express = require('express');
const router = express.Router();
const PostModel = require('../models/postModel');


/// POST ROUTES ///

// GET request for list of all Post items.
router.get('/all', async function (req, res) {
    try {
        const posts = await PostModel.find({});
        return res.status(200).send(posts);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

// POST request for creating Post.
router.post('/create', async function (req, res) {
    console.log(req.params);
    res.send('NOT IMPLEMENTED: Post create GET');
});

// DELETE request to delete Post.
router.delete('/delete/:id', async function (req, res) {
    res.send('NOT IMPLEMENTED: Post delete GET');
});

// GET request to update Post.
router.patch('/update/:id', async function (req, res) {
    res.send('NOT IMPLEMENTED: Post update GET');
});

// GET request for one Post.
router.get('/:id', async function (req, res) {
    try {
        const post = await PostModel.findById(req.params.id);
        if (!post) return res.status(404).send();
        res.status(200).send(post);
    }
    catch (e) {
        res.status(500).send(e);
    }
});


module.exports = router;