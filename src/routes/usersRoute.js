const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs/promises');
const UserModel = require('../models/usersModel')
const auth = require('../middleware/auth')
const multer = require('../middleware/multer')
const { errorComposer } = require('../funcs/errorComposer')
const { parameterChecker } = require('../funcs/parameterChecker')

router.post('/users/me/:mediatype', auth, multer.userMulter, async (req, res) => {
    const mediaType = req.params.mediatype
    if (mediaType !== "avatar" && mediaType !== "backgroundImage") return res.status(400).send()
    if (req.files !== undefined) {
        const filename = (req.files[mediaType])[0].filename
        if (req.user[mediaType]) {
            await fs.unlink(path.join(__dirname, `../../media/${mediaType}s/${req.user[mediaType]}`))
        }
        req.user[mediaType] = filename
        await req.user.save()
        //let filePath = path.join(__dirname, `../../media/${mediaType}s/${filename}`);
        return res.status(200).send(filename)
    }
    else return res.status(400).send()
}, (error, req, res, next) => {
    return res.status(500).send({ error: error.message })
})

router.get('/users/:username/:mediatype', async (req, res) => {
    try {
        const mediaType = req.params.mediatype
        if (mediaType !== "avatar" && mediaType !== "backgroundImage") return res.status(400).send()
        const user = await UserModel.findOne({ username: req.params.username })
        if (!user) return res.status(404).send()

        if (user[mediaType]) {
            let filePath = path.join(__dirname, `../../media/${mediaType}s/${user[mediaType]}`);
            return res.status(200).sendFile(filePath)
        }
        else {
            return res.status(404).send()
        }
    }
    catch (err) {
        return res.status(500).send(err.toString())
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
        return res.status(200).send()
    }
    catch (err) {
        return res.status(500).send(err.toString())
    }
})

/// USER ROUTES ///

// GET request for list of all Users.
router.get('/users/', async function (req, res) {
    try {
        const users = await UserModel.find({});
        return res.status(200).send(users);
    }
    catch (err) {
        return res.status(500).send(err.toString())
    }
})

//GET request for one User.
router.get('/users/:username', async function (req, res) {
    try {
        const user = await UserModel.findOne({ username: req.params.username })
        if (!user) return res.status(404).send()

        if (!user.settings.hidePosts) {
            await user.populate('posts')
        }

        if (req.user !== undefined && user._id.equals(req.user._id)) {
            return res.status(200).send(user.toLimitedJSON(1))
        }
        else {
            return res.status(200).send(user.toLimitedJSON(2))
        }
    }
    catch (err) {
        return res.status(500).send(err.toString())
    }
})

// POST request for logging the user in.
router.post('/users/login', async function (req, res) {
    try {
        parameterChecker(req, ['email', 'password'])

        const userToLimit = await UserModel.verifyCredentials(req.body.email, req.body.password)
        const token = await userToLimit.generateToken()
        const user = userToLimit.toLimitedJSON(1)
        return res.status(200).send({ user, token })
    }
    catch (err) {
        if (err.name === "VerificationError") {
            return res.status(400).send(err.arrayMessage);
        }
        if (err.name === "ParameterError") {
            return res.status(400).send(["params", "Invalid request, got invalid parameters"])
        }
        return res.status(500).send(err.toString())
    }
})

// POST request for logging the user out.
router.post('/users/logout', auth, async function (req, res) {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        return res.status(200).send()
    }
    catch (err) {
        return res.status(500).send(err.toString())
    }
})

// POST request for logging the user out from all sessions.
router.post('/users/logoutall', auth, async function (req, res) {
    try {
        req.user.tokens = []
        await req.user.save()
        return res.status(200).send()
    }
    catch (err) {
        return res.status(500).send(err.toString())
    }
})

// POST request for creating User.
router.post('/users', async function (req, res) {
    try {
        parameterChecker(req, ['email', 'username', 'password'])

        let userData = req.body
        userData.displayName = userData.username
        const createdUser = new UserModel(userData)
        await createdUser.save()

        const user = createdUser.toLimitedJSON(2)
        const token = await createdUser.generateToken()

        return res.status(201).send({ user, token })
    }
    catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).send(errorComposer(err));
        }
        if (err.name === "ParameterError") {
            return res.status(400).send(["params", "Invalid request, got invalid parameters"])
        }
        return res.status(500).send();
    }
})

// DELETE request to delete User.
router.delete('/users/me', auth, async function (req, res) {
    try {
        await req.user.remove()
        return res.status(200).send()
    }
    catch (err) {
        return res.status(500).send(err.toString())
    }
})

// PATCH request to update User.
router.patch('/users/me/password', auth, async function (req, res) {
    try {
        parameterChecker(req, ['currentPassword', 'newPassword'])


        await UserModel.verifyPassword(req.user, req.body.currentPassword, req.body.newPassword)
        req.user.password = req.body.newPassword
        await req.user.save()
        return res.status(200).send()
    }
    catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).send(errorComposer(err));
        }
        if (err.name === "ParameterError") {
            return res.status(400).send(["params", "Invalid request, got invalid parameters"])
        }
        if (err.name === "VerificationError") {
            return res.status(400).send(err.arrayMessage)
        }
        return res.status(500).send(err.toString())
    }
})

router.patch('/users/me/important', auth, async function (req, res) {
    try {
        parameterChecker(req, ['email', 'username', 'password'])

        await UserModel.verifyPassword(req.user, req.body.currentPassword)
        reqKeys.forEach((key) => req.user[key] = req.body[key])
        await req.user.save()
        return res.status(200).send(req.user)
    }
    catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).send(errorComposer(err));
        }
        if (err.name === "ParameterError") {
            return res.status(400).send(["params", "Invalid request, got invalid parameters"])
        }
        if (err.name === "VerificationError") {
            return res.status(400).send(err.arrayMessage)
        }
        return res.status(500).send(err.toString())
    }
})

router.patch('/users/me/regular', auth, async function (req, res) {
    try {
        parameterChecker(req, ['displayName', 'bio', 'hideWhenMade', 'hidePosts'])

        reqKeys.forEach((key) => req.user[key] = req.body[key])
        await req.user.save()
        return res.status(200).send(req.user)
    }
    catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).send(errorComposer(err));
        }
        if (err.name === "ParameterError") {
            return res.status(400).send(["params", "Invalid request, got invalid parameters"])
        }
        if (err.name === "VerificationError") {
            return res.status(400).send(err.arrayMessage)
        }
        return res.status(500).send(err.toString())
    }
})
module.exports = router
