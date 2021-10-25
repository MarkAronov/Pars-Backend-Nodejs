const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const PostModel = require('../models/postsModel')

const UserSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      maxLength: 64,
      trim: true,
      validate(value) {
        if (validator.contains(value, ' ')) throw new Error('Username contains whitespace')
      }
    },
    email: {
      type: String,
      unique: true,
      required: true,
      maxLength: 254,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error('Invalid email')
      }
    },
    password: {
      type: String,
      required: true,
      maxLength: 254,
      validate(value) {
        //console.log(validator.isStrongPassword(value, { minlength: 12 }))
      }
    },
    // posts: {
    //   type: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Post'
    //   }]
    // },
    tokens: [{
      token: {
        type: String,
        required: true,
      }
    }]
  }, {
    timestamps: true
  }
)

UserSchema.virtual('posts', {
  ref: 'Post',
  localField: 'id',
  foreignField: 'user'
})

UserSchema.methods.generateToken = async function () {
  const user = this
  const token = jwt.sign({ id: user._id.toString() }, 'placebotoken', { expiresIn: '14d' })
  user.tokens = user.tokens.concat({ token })
  await user.save()
  return token
}

UserSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()
  delete userObject.password
  delete userObject.tokens

  return userObject
}

UserSchema.statics.verifyCredentials = async function (email, password) {
  const user = await User.findOne({ email })
  if (!user) throw new Error('email')

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw new Error('password')
  return user
}

UserSchema.pre('remove', async function (next) {
  const user = this
  await user.populate('posts')
  for (let i = 0; i < await user.posts.length; i++) {
    let post = await PostModel.findById(user.posts[i])
    await post.deleteRelations()
    await post.remove()
  }
  next()
})

UserSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    const hashedPassword = await bcrypt.hash(user.password, 8)
    user.password = hashedPassword
  }
  next()
})

//Export model
const User = mongoose.model('User', UserSchema)
module.exports = User