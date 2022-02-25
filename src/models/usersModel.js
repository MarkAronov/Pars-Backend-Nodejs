const mongoose = require('mongoose')

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
var uniqueValidator = require('mongoose-unique-validator')

const PostModel = require('./postsModel')
const checkers = require('../funcs/checkers')
const ErrorArray = require('../funcs/ErrorArray')


const schemaOptions = {
  toJSON: {
    virtuals: true
  },
  toObject: {
    vituals: true
  },
  timestamps: true,
  id: false,
}

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      maxLength: [64, 'Username is longer than 64 characters'],
      trim: true,
      async validate(value) {
        let usernameErrors = []
        usernameErrors = checkers.usernameChecker(value)
        if (usernameErrors.length !== 0) throw new ErrorArray(usernameErrors, '')
      }
    },
    displayName: {
      type: String,
      maxLength: [128, 'Display-Name is longer than 128 characters'],
      default: '',
      trim: true,

    },
    email: {
      type: String,
      unique: true,
      required: true,
      maxLength: [254, 'Email is longer than 254 characters'],
      lowercase: true,
      trim: true,
      async validate(value) {
        let emailErrors = []
        emailErrors = checkers.emailChecker(value)
        if (emailErrors.length !== 0) throw new ErrorArray(emailErrors, '')
      }
    },
    password: {
      type: String,
      required: true,
      maxLength: 254,
      validate(value) {
        let passwordErrorsList = []
        passwordErrorsList = checkers.passwordChecker(value)
        if (passwordErrorsList.length !== 0) throw new ErrorArray(passwordErrorsList, '')
      }
    },
    bio: {
      type: String,
      maxLength: [400, 'Bio is longer than 400 characters'],
      default: '',
      trim: true,
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
    }],
    avatar: {
      type: String,
      default: null,
    },
    backgroundImage: {
      type: String,
      default: null,
    },
    settings: {
      hideWhenMade: {
        type: Boolean,
        required: true,
        default: false,
      },
      hidePosts: {
        type: Boolean,
        required: true,
        default: false,
      },

    },
    formerPasswords: [String],
  },
  schemaOptions
)


UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user'
})

UserSchema.methods.generateToken = async function () {
  const user = this
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_STRING, { expiresIn: '2 days' })
  user.tokens = user.tokens.concat({ token })
  await user.save()
  return token
}

UserSchema.methods.toLimitedJSON = function (limitLevevl) {
  const user = this
  const userObject = user.toObject({ virtuals: true })

  if (user.settings.hideWhenMade) {
    delete userObject.createdAt
  }
  delete userObject.updatedAt
  delete userObject.password
  delete userObject.__v
  if (limitLevevl >= 1) {
    delete userObject.tokens
    delete userObject._id
    delete userObject.settings
    delete userObject.email
  }
  if (limitLevevl >= 2) {
    delete userObject.createdAt
  }
  return userObject
}

UserSchema.statics.verifyCredentials = async function (email, password) {
  const user = await User.findOne({ email })
  if (!user) {
    throw new ErrorArray(['email', 'Invaid email'], 'VerificationError')
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw new ErrorArray(['password', 'Incorrect password'], 'VerificationError')
  }
  return user
}

UserSchema.statics.verifyPassword = async function (user, password, newPassword = null) {
  if (newPassword) {
    for (let i = 0; i < user.formerPasswords.length; i++) {
      const key = user.formerPasswords[i]
      if (await bcrypt.compare(newPassword, key)) {
        throw new ErrorArray(['password', 'Password was formally used, use another'], 'VerificationError')
      }
    }
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw new ErrorArray(['password', 'Incorrect password'], 'VerificationError')
  return
}

UserSchema.pre('remove', async function (next) {
  const user = this
  await user.populate('posts')
  for (let postID of user.posts) {
    let post = await PostModel.findById(postID)
    await post.remove()
  }
  next()
})

UserSchema.pre('save', async function (next) {
  const user = this
  if (user.isModified('password')) {
    const hashedPassword = await bcrypt.hash(user.password, 8)
    user.formerPasswords.push(hashedPassword)
    user.password = hashedPassword
  }
  next()
})

//Add any plug-ins there are
UserSchema.plugin(uniqueValidator, { message: "dupe" });

//Export model
const User = mongoose.model('User', UserSchema)
module.exports = User