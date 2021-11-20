const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const PostModel = require('./postsModel')

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
    }],
    avatar: {
      type: String,
    },
    backgroundImage: {
      type: Buffer,
    },
    settings: {
      hideLastSeen: {
        type: Boolean,
        required: true,
        default: false,
      },
      hidePosts: {
        type: Boolean,
        required: true,
        default: false,
      }
    }
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
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_STRING, { expiresIn: '14d' })
  user.tokens = user.tokens.concat({ token })
  await user.save()
  return token
}

UserSchema.methods.toLimitedJSON = function (limitLevevl) {
  const user = this
  const userObject = user.toObject({ virtuals: true })

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
    delete userObject.updatedAt
  }
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
    user.password = hashedPassword
  }
  next()
})

//Export model
const User = mongoose.model('User', UserSchema)
module.exports = User