const express = require('express');
const router = express.Router();
const UserModel = require('../models/userModel')


/// USER ROUTES ///

// GET request for list of all Users.
router.get('/all', async function (req, res) {
    try {
        const users = await UserModel.find({});
        return res.status(200).send(users);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

// GET request for creating User.
router.post('/create', async function (req, res) {
    try {
        let user = await UserModel.findOne({ "_email": req.body._email })
        if (user) return res.status(400).send("Email");
        user = await UserModel.findOne({ "_name": req.body._name })
        if (user) return res.status(400).send("Username");
    }
    catch (e) {
        res.status(400).send(e)
    }
    const newUser = new UserModel(req.body);
    try {
        await newUser.save()
        res.status(201).send(newUser);
    }
    catch (e) {
        res.status(400).send(e)
    }
});

// DELETE request to delete User.
router.delete('/delete/:id', async function (req, res) {
    try {
        const user = await UserModel.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).send();
        res.status(200).send(user);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

// PATCH request to update User.
router.patch('/update/:id', async function (req, res) {
    const updateKeys = Object.keys(req.body)
    const userParams = ['_name', '_email', '_password', '_posts']
    if (!updateKeys.every((key) => userParams.includes(key))) return res.status(400).send()
    try {
        const user = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!user) return res.status(404).send();
        res.status(200).send(user);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

// GET request for one User.
router.get('/:name', async function (req, res) {
    try {
        const user = await UserModel.findOne({ _name: req.params.name });
        if (!user) return res.status(404).send();
        res.status(200).send(user);
    }
    catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;
