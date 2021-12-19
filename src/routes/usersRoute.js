const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const auth = require('../middleware/auth')
const UserModel = require('../models/usersModel')
const crypto = require("crypto");
const fs = require('fs/promises');

/// MULTER SETTINGS ///
const megabyte = 1000000

const userMediaTypes = [
    { name: 'avatar', maxCount: 1 },
    { name: 'backgroundImage', maxCount: 1 }
]

const userMediaUpload = multer({
    limits: {
        fileSize: 10 * megabyte,
        files: 1,
    },
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, `./media/${file.fieldname}s`)
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = crypto.randomBytes(16).toString('hex')
            cb(null, file.fieldname + '-' + req.user._id + '-' + Date.now() + '-' + uniqueSuffix)
        }
    }),
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|png|gif)$/)) {
            return callback(new Error('The only formats allowed are PNG, JPG and GIF'))
        }
        callback(undefined, true)
    },
})

router.post('/users/me/:mediatype', auth, userMediaUpload.fields(userMediaTypes), async (req, res) => {
    const mediaType = req.params.mediatype
    if (mediaType !== "avatar" && mediaType !== "backgroundImage") return res.status(400).send()
    console.log(req.files)
    if (mediaType === "avatar") {
        if (req.user.avatar) {
            await fs.unlink(path.join(__dirname, `../../media/${mediaType}s/${req.user.avatar}`))
        }
        req.user.avatar = req.files.avatar[0].filename
    }
    if (mediaType === "backgroundImage") {
        if (req.user.backgroundImage) {
            await fs.unlink(path.join(__dirname, `../../media/${mediaType}s/${req.user.backgroundImage}`))
        }
        req.user.backgroundImage = req.files.backgroundImage[0].filename
    }
    await req.user.save()
    let filePath = path.join(__dirname, `../../media/${mediaType}s/${req.files.filename}`);
    res.status(200).sendFile(filePath)
    res.status(200).send()
}, (error, req, res, next) => {
    console.log(error)
    res.status(400).send({ error: error.message })
})

router.get('/users/:name/:mediatype', auth, async (req, res) => {
    try {
        const mediaType = req.params.mediatype
        if (mediaType !== "avatar" && mediaType !== "backgroundImage") return res.status(400).send()
        const user = await UserModel.findOne({ name: req.params.name })
        if (!user) return res.status(404).send()

        if (user.avatar && mediaType === "avatar") {
            let filePath = path.join(__dirname, `../../media/${mediaType}s/${user.avatar}`);
            res.status(200).sendFile(filePath)
        }
        else if (user.backgroundImage && mediaType === "backgroundImage") {
            let filePath = path.join(__dirname, `../../media/${mediaType}s/${user.backgroundImage}`);
            res.status(200).sendFile(filePath)
        }
        else {
            res.status(404).send()
        }
    }
    catch (e) {
        //console.log(e)
        res.status(500).send(e.toString())
    }
})

router.delete('/users/me/:mediatype', auth, async (req, res) => {
    try {
        const mediaType = req.params.mediatype
        if (mediaType !== "avatar" && mediaType !== "backgroundImage") return res.status(400).send()
        if (req.user.avatar && mediaType === "avatar") {
            await fs.unlink(path.join(__dirname, `../../media/${mediaType}s/${req.user.avatar}`))
            req.user.avatar = null
            await req.user.save()
        }
        if (req.user.backgroundImage && mediaType === "backgroundImage") {
            await fs.unlink(path.join(__dirname, `../../media/${mediaType}s/${req.user.backgroundImage}`))
            req.user.backgroundImage = null
            await req.user.save()
        }
        res.status(200).send()
    }
    catch (e) {
        //console.log(e)
        res.status(500).send(e.toString())
    }
})

/// USER ROUTES ///

// GET request for list of all Users.
router.get('/users/', auth, async function (req, res) {
    try {
        const users = await UserModel.find({});
        return res.status(200).send(users);
    }
    catch (e) {
        //console.log(e)
        res.status(500).send(e.toString())
    }
})

//GET request for one User.
router.get('/users/:name', auth, async function (req, res) {
    try {
        const user = await UserModel.findOne({ name: req.params.name })
        if (!user) return res.status(404).send()
        if (!user.settings.hidePosts) {
            await user.populate('posts')
        }
        if (user._id.equals(req.user._id)) {
            res.status(200).send(user.toLimitedJSON(1))
        }
        else {
            res.status(200).send(user.toLimitedJSON(2))
        }
    }
    catch (e) {
        //console.log(e)
        res.status(500).send(e.toString())
    }
})

// POST request for logging the user in.
router.post('/users/login', async function (req, res) {
    try {
        const userToLimit = await UserModel.verifyCredentials(req.body.email, req.body.password)
        const token = await userToLimit.generateToken()
        const user = userToLimit.toLimitedJSON(1)
        res.status(200).send({ user, token })
    }
    catch (e) {
        //console.log(e.toString())
        res.status(400).send(e.toString())
    }
})

// POST request for logging the user out.
router.post('/users/logout', auth, async function (req, res) {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.status(200).send()
    }
    catch (e) {
        //console.log(e)
        res.status(400).send(e.toString())
    }
})

// POST request for logging the user out from all sessions.
router.post('/users/logoutall', auth, async function (req, res) {
    try {
        req.user.tokens = []
        await req.user.save()

        res.status(200).send()
    }
    catch (e) {
        //console.log(e)
        res.status(400).send(e.toString())
    }
})

// POST request for creating User.
router.post('/users', async function (req, res) {

    const user = new UserModel(req.body)
    try {
        await user.save()
        const token = await user.generateToken()
        res.status(201).send({ user, token })
    }
    catch (e) {
        //console.log(e)
        res.status(400).send(e.toString())
    }
})

// DELETE request to delete User.
router.delete('/users/me', auth, async function (req, res) {
    try {
        await req.user.remove()
        res.status(200).send(req.user)
    }
    catch (e) {
        //console.log(e)
        res.status(500).send(e.toString())
    }
})

// PATCH request to update User.
router.patch('/users/me', auth, async function (req, res) {
    const updateKeys = Object.keys(req.body)
    const userParams = ['name', 'email', 'password']
    if (!updateKeys.every((key) => userParams.includes(key))) return res.status(400).send()
    try {
        updateKeys.forEach((key) => req.user[key] = req.body[key])
        await req.user.save()
        res.status(200).send(req.user)
    }
    catch (e) {
        //console.log(e)
        res.status(400).send(e.toString())
    }
})

module.exports = router
