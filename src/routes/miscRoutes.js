const express = require('express')
const router = express.Router()
const PostModel = require('../models/postsModel')
const UserModel = require('../models/usersModel')
// 	OTHER NEEDED ROUTES 

// GET request for finding posts/users
router.get('/search/', async function (req, res) {
	try {
		const post = await PostModel.find()
		const user = await UserModel.find()
		res.status(200).send(post)
	}
	catch (err) {
		//console.log(err)
		res.status(500).send(err.toString())
	}
})

module.exports = router