const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserModel = require('../models/usersModel')


/// USER ROUTES ///

// GET request for list of all Users.
router.get('/users/me', auth, async function (req, res) {
    return res.status(200).send(req.user);
});

// POST request for logging the user in.
router.post('/users/login', async function (req, res) {
    try {
        const user = await UserModel.verifyCredentials(req.body._email, req.body._password);
        const token = await user.generateToken();
        res.status(200).send({ user, token })
    }
    catch (e) {
        console.log(e)
        res.status(400).send(e.toString());
    }
});

// POST request for logging the user out.
router.post('/users/logout', auth, async function (req, res) {
    try {
        req.user._tokens = req.user._tokens.filter((token) => {
            return token._token !== req.token
        })
        await req.user.save()

        res.status(200).send()
    }
    catch (e) {
        console.log(e)
        res.status(400).send(e.toString());
    }
});

// POST request for logging the user out from all sessions.
router.post('/users/logoutall', auth, async function (req, res) {
    try {
        req.user._tokens = []
        await req.user.save()

        res.status(200).send()
    }
    catch (e) {
        console.log(e)
        res.status(400).send(e.toString());
    }
});

// POST request for creating User.
router.post('/users', async function (req, res) {
    const newUser = new UserModel(req.body);
    try {
        await newUser.save()
        const token = await newUser.generateToken();
        res.status(201).send({ newUser, token });
    }
    catch (e) {
        console.log(e)
        res.status(400).send(e.toString());
    }
});

// DELETE request to delete User.
router.delete('/users/:id', async function (req, res) {
    try {
        const user = await UserModel.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).send();
        res.status(200).send(user);
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString());
    }
});

// PATCH request to update User.
router.patch('/users/:id', async function (req, res) {
    const updateKeys = Object.keys(req.body)
    const userParams = ['_name', '_email', '_password', '_posts']
    if (!updateKeys.every((key) => userParams.includes(key))) return res.status(400).send()
    try {
        const user = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!user) return res.status(404).send();
        res.status(200).send(user);
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString());
    }
});

// GET request for one User.
router.get('/users/:name', async function (req, res) {
    try {
        const user = await UserModel.findOne({ _name: req.params.name });
        if (!user) return res.status(404).send();
        res.status(200).send(user);
    }
    catch (e) {
        console.log(e)
        res.status(500).send(e.toString());
    }
});

module.exports = router;
