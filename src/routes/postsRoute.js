const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const auth = require('../middleware/auth')
const PostModel = require('../models/postsModel')

/// POST ROUTES ///

// GET request for list of all Post items.
router.get('/posts', async function (req, res) {
    try {
        const posts = await PostModel.find({})
        return res.status(200).send(posts)
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
})

// POST request for creating Post.
router.post('/posts', auth, async function (req, res) {
    const newPost = new PostModel({ ...req.body, user: req.user._id })
    newPost.edited = false
    try {
        let parents = req.body.parentsids.slice()
        for (let i = 0; i < parents.length; i++) {
            const parent = await PostModel.findById(parents[i])
            if (!parent) return res.status(404).send('No parent by that id: ' + parents[i])
            if (parent._id.toString() === newPost._id.toString()) return res.status(400).send('You cannot reply to yourself')
        }
        for (let i = 0; i < parents.length; i++) {
            const parent = await PostModel.findById(parents[i])
            newPost.parents = newPost.parents.concat(parent._id)
            parent.children = parent.children.concat(newPost._id)
            await parent.save()
        }
        await newPost.save()
        // req.user.posts = req.user.posts.concat(newPost._id)
        await req.user.save()
        res.status(201).send(newPost)
    }
    catch (e) {
        console.log(e)
        res.status(400).send(e.toString())
    }
})

// DELETE request to delete Post.
router.delete('/posts/:id', auth, async function (req, res) {
    try {
        const post = await PostModel.findById(req.params._id)
        if (!post) return res.status(404).send()
        if (post.user._id.toString() !== req.user._id.toString()) return res.status(403).send('You are not allowed to delete this post')
        // req.user.posts.splice(req.user.posts.indexOf(post._id), 1)
        await req.user.save()
        post.deleteRelations()
        post.remove()
        res.status(200).send(post)
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString())
    }
})

// GET request to update Post.
router.patch('/posts/:id', auth, async function (req, res) {
    const updateKeys = Object.keys(req.body)
    const userParams = ['title', 'content', 'parentsids',]
    if (!updateKeys.every((key) => userParams.includes(key))) return res.status(400).send()
    try {
        const post = await PostModel.findById(req.params._id)
        if (!post) return res.status(404).send()
        if (post.user._id.toString() !== req.user._id.toString()) return res.status(403).send('You are not allowed to change this post')

        let currentParents = post.parents.slice().map(value => value._id.toString())
        let updatedParents = req.body.parentsids.slice()
        for (let i = 0; i < currentParents.length; i++) {
            const currentParent = await PostModel.findById(currentParents[i])
            if (!currentParent) return res.status(404).send()
        }
        for (let i = 0; i < updatedParents.length; i++) {
            const updatedParent = await PostModel.findById(updatedParents[i])
            if (!updatedParent) return res.status(404).send()
            if (updatedParent._id.toString() === post._id.toString()) return res.status(400).send('You cannot reply to yourself')
        }
        post.title = req.body.title
        post.content = req.body.content
        post.edited = true
        for (let i = 0; i < post.parents.length; i++) {
            let currParentId = post.parents[i]
            if (updatedParents.indexOf(currParentId) === -1) {
                currentParents.splice(currentParents.indexOf(currParentId), 1)
                const formerParent = await PostModel.findById(currParentId)
                formerParent.children.splice(formerParent.children.indexOf(post._id), 1)
                await formerParent.save()
            }
        }
        for (let i = 0; i < updatedParents.length; i++) {
            let newerParentId = updatedParents[i]
            if (currentParents.indexOf(newerParentId) === -1) {
                currentParents.push(newerParentId)
                const newerParent = await PostModel.findById(newerParentId)
                newerParent.children = newerParent.children.concat(post._id)
                await newerParent.save()
            }
        }
        post.parents = currentParents.map(parent => mongoose.Types.ObjectId(parent))
        await post.save()
        res.status(200).send(post)
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString())
    }
})

// GET request for one Post.
router.get('/posts/:_id', async function (req, res) {
    try {
        const post = await PostModel.findById(req.params._id)
        if (!post) return res.status(404).send()
        res.status(200).send(post)
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString())
    }
})


module.exports = router