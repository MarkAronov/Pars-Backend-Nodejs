const jwt = require('jsonwebtoken')
const UserModel = require('../models/usersModel')

const auth = async (req, res, next) => {
    try {
        if (!req.header('Authorization')) throw new Error('401')
        const uncodedToken = req.header('Authorization').replace('Bearer ', '')
        const decodedToken = jwt.verify(uncodedToken, process.env.JWT_STRING)
        const user = await UserModel.findOne({ _id: decodedToken.id, 'tokens.token': uncodedToken })
        if (!user) throw new Error('401')
        req.token = uncodedToken
        req.user = user
        next()
    } catch (e) {
        if (e.message === '401')
            res.status(401).send({ error: 'Authenticate first' })
        else
            res.status(500).send(e)
    }
}

module.exports = auth