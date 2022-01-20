const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const auth = require('../middleware/auth')
const UserModel = require('../models/usersModel')
const crypto = require("crypto");
const fs = require('fs/promises');
const validator = require('validator')

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

function usernameChecker(str, nameErrors) {
    if (validator.contains(str, ' ')) nameErrors.push(['validation', 'Username contains whitespace'])
    if (!str.match(/^[0-9a-zA-Z\s]+$/)) nameErrors.push(['validation', 'Username contains none alphanumeric characters'])
    return nameErrors
}

function emailChecker(str, emailErrors) {
    if (!validator.isEmail(str)) emailErrors(['validation', 'Invalid email'])
    return emailErrors
}

function passwordChecker(str, passwordErrors) {
    const lowercase = str.match(/[a-z]/)
    const uppercase = str.match(/[A-Z]/)
    const numbers = str.match(/[0-9]/)

    // Minimum: 10 chars | 1 Uppercase | 1 lowercase | 1 digit
    if (str.length < 10) passwordErrors.push(['validation', "Password is less than 10 characters"])
    if (!lowercase) passwordErrors.push(['validation', "Password must have at least one lowercase"])
    if (!uppercase) passwordErrors.push(['validation', "Password must have at least one uppercase"])
    if (!numbers) passwordErrors.push(['validation', "Password must have at least one digit"])

    // Password entropy
    const E = str.length * Math.log2(filterDupes(str.split('')).length)

    return { passwordErrors, E }
}
/// MULTER SETTINGS ///
const megabyte = 1000000

const userMediaTypes = [
    { username: 'avatar', maxCount: 1 },
    { username: 'backgroundImage', maxCount: 1 }
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

router.get('/users/:username/:mediatype', auth, async (req, res) => {
    try {
        const mediaType = req.params.mediatype
        if (mediaType !== "avatar" && mediaType !== "backgroundImage") return res.status(400).send()
        const user = await UserModel.findOne({ username: req.params.username })
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
    catch (err) {
        //console.log(err)
        res.status(500).send(err.toString())
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
    catch (err) {
        //console.log(err)
        res.status(500).send(err.toString())
    }
})

/// USER ROUTES ///

// GET request for list of all Users.
router.get('/users/', auth, async function (req, res) {
    try {
        const users = await UserModel.find({});
        return res.status(200).send(users);
    }
    catch (err) {
        //console.log(err)
        res.status(500).send(err.toString())
    }
})

//GET request for one User.
router.get('/users/:username', auth, async function (req, res) {
    try {
        const user = await UserModel.findOne({ username: req.params.username })
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
    catch (err) {
        //console.log(err)
        res.status(500).send(err.toString())
    }
})

// POST request for logging the user in.
router.post('/users/login', async function (req, res) {
    const errorMap = new Map([
        ['email', 'Invaid email'],
        ['password', 'Incorrect password'],
    ]);
    try {
        const userToLimit = await UserModel.verifyCredentials(req.body.email, req.body.password)
        const token = await userToLimit.generateToken()
        const user = userToLimit.toLimitedJSON(1)
        res.status(200).send({ user, token })
    }
    catch (err) {
        //console.log(err.toString())
        const errorField = err.toString().replace('Error: ', '')
        res.status(400).send({ [errorField]: errorMap.get(errorField) })
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
    catch (err) {
        //console.log(err)
        res.status(400).send(err.toString())
    }
})

// POST request for logging the user out from all sessions.
router.post('/users/logoutall', auth, async function (req, res) {
    try {
        req.user.tokens = []
        await req.user.save()

        res.status(200).send()
    }
    catch (err) {
        //console.log(err)
        res.status(400).send(err.toString())
    }
})

// POST request for creating User.
router.post('/users', async function (req, res) {
    let errors = {
        username: [],
        email: [],
        password: [],
    }
    let passwordEntropy
    let checkUser;
    let userData = req.body

    userData.displayName = userData.username

    checkUser = await UserModel.findOne({ username: userData.username })
    if (checkUser) errors.username.push(['dupe', "Name is already taken"])
    else errors.username = usernameChecker(userData.username, errors.username)

    checkUser = await UserModel.findOne({ email: userData.email })
    if (checkUser) errors.email.push(['dupe', "Email is already taken"])
    else errors.email = emailChecker(userData.email, errors.email)

    const { passwordErrors, E } = passwordChecker(userData.password, errors.password)
    errors.password = passwordErrors;
    passwordEntropy = E;

    const errorList = Object.values(errors)
    for (let i = 0; i < errorList.length; i++) {
        if (errorList[i].length !== 0) return res.status(400).send(errors)
    }

    try {
        const createdUser = new UserModel(userData)
        await createdUser.save()
        const user = createdUser.toLimitedJSON(2)
        const token = await createdUser.generateToken()
        res.status(201).send({ user, token, passwordEntropy })
    }
    catch (err) {
        // console.log(err)
        // if (err && err.code === 11000) {
        //     if (err.keyPattern.username) {
        //         return res.status(400).send({ "username": "dupe" })
        //     }
        //     if (err.keyPattern.email) {
        //         return res.status(400).send({ "email": "dupe" })
        //     }
        //     return res.status(400).send(err)
        // }
        // else {
        res.status(400).send()
        // }
    }
})

// DELETE request to delete User.
router.delete('/users/me', auth, async function (req, res) {
    try {
        await req.user.remove()
        res.status(200).send(req.user)
    }
    catch (err) {
        //console.log(err)
        res.status(500).send(err.toString())
    }
})

// PATCH request to update User.
router.patch('/users/me', auth, async function (req, res) {
    const updateKeys = Object.keys(req.body)
    const userParams = ['username', 'email', 'password']
    if (!updateKeys.every((key) => userParams.includes(key))) return res.status(400).send()
    try {
        updateKeys.forEach((key) => req.user[key] = req.body[key])
        await req.user.save()
        res.status(200).send(req.user)
    }
    catch (err) {
        //console.log(err)
        res.status(400).send(err.toString())
    }
})

module.exports = router
