const express = require('express')
const router = express.Router()
const multer = require('multer')
const auth = require('../middleware/auth')
const UserModel = require('../models/usersModel')
const PostModel = require('../models/postsModel')


/// MULTER SETTINGS ///
const megabyte = 1000000

const upload = multer({
    limits: {
        fileSize: 10 * megabyte,
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|png|gif)$/)) {
            return callback(new Error('The only formats allowed are PNG, JPG and GIF'))
        }
        callback(undefined, true)
    },
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async function (req, res) {
    req.user.avatar = req.file.buffer
    await req.user.save()
    res.status(200).send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.status(200).send()
})

/// USER ROUTES ///

// GET request for list of all Users.
router.get('/users/', auth, async function (req, res) {
    try {
        const users = await UserModel.find({});
        return res.status(200).send(users);
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString())
    }
})

//GET request for one User.
router.get('/users/:name', auth, async function (req, res) {
    try {
        const user = await UserModel.findOne({ name: req.params.name })
        if (!user) return res.status(404).send()
        res.status(200).send(user)
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString())
    }
})

// POST request for logging the user in.
router.post('/users/login', async function (req, res) {
    try {
        const user = await UserModel.verifyCredentials(req.body.email, req.body.password)
        const token = await user.generateToken()
        res.status(200).send({ user, token })
    }
    catch (e) {
        console.log(e.toString())
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
        console.log(e)
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
        console.log(e)
        res.status(400).send(e.toString())
    }
})

// POST request for creating User.
router.post('/users', async function (req, res) {
    const newUser = new UserModel(req.body)
    try {
        await newUser.save()
        const token = await newUser.generateToken()
        res.status(201).send({ newUser, token })
    }
    catch (e) {
        console.log(e)
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
        console.log(e)
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
        console.log(e)
        res.status(400).send(e.toString())
    }
})

module.exports = router
