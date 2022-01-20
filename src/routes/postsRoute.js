const express = require('express')
const router = express.Router()
const multer = require('multer')
const mongoose = require('mongoose')
const auth = require('../middleware/auth')
const PostModel = require('../models/postsModel')


/// MULTER SETTINGS ///
const megabyte = 1000000

const avatarUpload = multer({
    limits: {
        fileSize: 50 * megabyte,
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|png|gif)$/)) {
            return callback(new Error('The only formats allowed are PNG, JPG and GIF'))
        }
        callback(undefined, true)
    },
})

// FUNCTIONS 
function filterDupes(arr) {
    const map = new Map()
    let filtered = []
    for (let a of arr) {
        if (map.get(a) === undefined) {
            map.set(a, true)
            filtered = filtered.concat(a)
        }
    }
    return filtered
}

/// POST ROUTES ///

// GET request for list of all Post items.
router.get('/posts', async function (req, res) {
    try {
        const posts = await PostModel.find({})
        return res.status(200).send(posts)
    }
    catch (err) {
        //console.log(err)
        res.status(500).send(err)
    }
})

// POST request for creating Post.
router.post('/posts', auth, async function (req, res) {
    const post = new PostModel({ ...req.body, user: req.user._id })
    const replyingParents = filterDupes(req.body.parents_ids.slice())
    try {
        if (replyingParents.length >= 0) {
            if (req.body.main_post !== null) {
                const mainPost = await PostModel.findById(req.body.main_post)
                if (!mainPost) return res.status(404).send(`No main post by that ID: ${req.body.main_post}`)
                post.mainPost = mainPost
                // mainPost.mainPostChildren = mainPost.mainPostChildren.concat(post._id)
                // await mainPost.save()
            }
            for (let parentID of replyingParents) {
                const parent = await PostModel.findById(parentID)
                if (!parent) return res.status(404).send(`No parent by that ID: ${parentID}`)
                if (parent._id.equals(post._id)) return res.status(400).send('You cannot reply to yourself')
            }
            for (let parentID of replyingParents) {
                const parent = await PostModel.findById(parentID)
                post.replyingParents = post.replyingParents.concat(parent._id)
                parent.replyingChildren = parent.replyingChildren.concat(post._id)
                await parent.save()
            }
            await post.save()
            res.status(201).send(post)
        }
        else {
            res.status(400).send('Invalid post')
        }
    }
    catch (err) {
        //console.log(err)
        res.status(400).send(err.toString())
    }
})

// DELETE request to delete Post.
router.delete('/posts/:id', auth, async function (req, res) {
    try {
        const post = await PostModel.findById(req.params.id)
        if (!post) return res.status(404).send()
        if (!post.user._id.equals(req.user._id)) return res.status(403).send('You are not allowed to delete this post')
        post.remove()
        res.status(200).send(post)
    }
    catch (err) {
        //console.log(err)
        res.status(500).send(err.toString())
    }
})

// GET request to update Post.
router.patch('/posts/:id', auth, async function (req, res) {
    const updateKeys = Object.keys(req.body)
    const userParams = ['title', 'content', 'parents_ids',]
    if (!updateKeys.every((key) => userParams.includes(key))) return res.status(400).send('Invalid request')
    try {
        const post = await PostModel.findById(req.params._id)
        if (!post) return res.status(404).send()
        if (!post.user._id.equals(req.user._id)) return res.status(403).send('You are not allowed to change this post')

        let currentParents = post.replyingParents.slice().map(value => value._id.toString())
        let updatedParents = req.body.parents_ids.slice()
        for (let currentParentID of currentParents) {
            const currentParent = await PostModel.findById(currentParentID)
            if (!currentParent) return res.status(404).send()
        }
        for (let updatedParentID of updatedParents) {
            const updatedParent = await PostModel.findById(updatedParentID)
            if (!updatedParent) return res.status(404).send()
            if (updatedParent._id.euqals(post._id)) return res.status(400).send('You cannot reply to yourself')
        }
        post.title = req.body.title
        post.content = req.body.content
        post.edited = true
        for (let currParentId of post.replyingParents) {
            if (updatedParents.indexOf(currParentId) === -1) {
                currentParents.splice(currentParents.indexOf(currParentId), 1)
                const formerParent = await PostModel.findById(currParentId)
                formerParent.replyingChildren.splice(formerParent.replyingChildren.indexOf(post._id), 1)
                await formerParent.save()
            }
        }
        for (let newerParentId of updatedParents) {
            if (currentParents.indexOf(newerParentId) === -1) {
                currentParents.push(newerParentId)
                const newerParent = await PostModel.findById(newerParentId)
                newerParent.replyingChildren = newerParent.replyingChildren.concat(post._id)
                await newerParent.save()
            }
        }
        post.replyingParents = currentParents.map(parent => mongoose.Types.ObjectId(parent))
        await post.save()
        res.status(200).send(post)
    }
    catch (err) {
        //console.log(err)
        res.status(500).send(err.toString())
    }
})

// GET request for one Post.
router.get('/posts/:id', async function (req, res) {
    try {
        const post = await PostModel.findById(req.params.id)
        if (!post) return res.status(404).send()
        res.status(200).send(post)
    }
    catch (err) {
        //console.log(err)
        res.status(500).send(err.toString())
    }
})


module.exports = router