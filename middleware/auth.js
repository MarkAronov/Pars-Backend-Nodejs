const jwt = require('jsonwebtoken')
const UserModel = require('../models/usersModel')

const auth = async (req, res, next) => {
    try {
        const uncodedToken = req.header('Authorization').replace('Bearer ', '')
        const decodedToken = jwt.verify(uncodedToken, 'placebotoken')
        const user = await UserModel.findOne({ _id: decodedToken._id, '_tokens._token': uncodedToken })
        if (!user) throw new Error()

        req.token = uncodedToken
        req.user = user
        next()

    } catch (e) {
        res.status(401).send({ error: 'Authenticate first' })
    }
}

module.exports = auth