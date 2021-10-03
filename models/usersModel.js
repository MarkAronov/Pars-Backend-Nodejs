const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const UserSchema = new Schema(
  {
    _name: {
      type: String,
      unique: true,
      required: true,
      maxLength: 64,
      trim: true,
      validate(value) {
        if (validator.contains(value, " ")) throw new Error('Username contains whitespace')
      }
    },
    _email: {
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
    _password: {
      type: String,
      required: true,
      maxLength: 254,
      validate(value) {
        //console.log(validator.isStrongPassword(value, { minlength: 12 }))
      }
    },
    _posts: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
      }]
    },
    _date_of_creation: {
      type: Date,
      required: true,
      default: new Date(),
    },
    _tokens: [{
      _token: {
        type: String,
        required: true,
      }
    }]
  },

)

UserSchema.methods.generateToken = async function () {
  const user = this
  const _token = jwt.sign({ _id: user._id.toString() }, 'placebotoken', { expiresIn: '14d' })
  user._tokens = user._tokens.concat({ _token })
  await user.save()
  return _token
}

UserSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()
  delete userObject._password
  delete userObject._tokens

  return userObject
}

UserSchema.statics.verifyCredentials = async function (_email, _password) {
  const user = await User.findOne({ _email })
  if (!user) throw new Error('Couldn\'t find user')

  const match = await bcrypt.compare(_password, user._password)
  if (!match) throw new Error('Incorrect password provided')
  return user
}

UserSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('_password')) {
    const hashedPassword = await bcrypt.hash(user._password, 8)
    user._password = hashedPassword
  }
  next()
})

//Export model
const User = mongoose.model('User', UserSchema)
module.exports = User