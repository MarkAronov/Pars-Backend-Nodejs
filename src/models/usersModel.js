import mongoose from 'mongoose';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import uniqueValidator from 'mongoose-unique-validator';

import PostModel from './postsModel.js';
import {
  usernameChecker,
  passwordChecker,
  emailChecker,
} from '../funcs/checkers.js';
import ErrorArray from '../funcs/ErrorArray.js';

const schemaOptions = {
  toJSON: {
    virtuals: true,
  },
  toObject: {
    vituals: true,
  },
  timestamps: true,
  id: false,
};

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      maxLength: [64, 'Username is longer than 64 characters.'],
      trim: true,
      async validate(value) {
        let usernameErrors = [];
        usernameErrors = usernameChecker(value);
        if (usernameErrors.length !== 0)
          throw new ErrorArray(usernameErrors, '');
      },
    },
    displayName: {
      type: String,
      maxLength: [128, 'Display Name is longer than 128 characters.'],
      default: '',
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      maxLength: [254, 'Email is longer than 254 characters.'],
      lowercase: true,
      trim: true,
      async validate(value) {
        let emailErrors = [];
        emailErrors = emailChecker(value);
        if (emailErrors.length !== 0) throw new ErrorArray(emailErrors, '');
      },
    },
    password: {
      type: String,
      required: true,
      maxLength: 254,
      async validate(value) {
        let passwordErrorsList = [];
        passwordErrorsList = passwordChecker(value);
        if (passwordErrorsList.length !== 0)
          throw new ErrorArray(passwordErrorsList, '');
      },
    },
    bio: {
      type: String,
      maxLength: [400, 'Bio is longer than 400 characters.'],
      default: '',
      trim: true,
    },
    // posts: {
    //   type: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Post'
    //   }]
    // },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
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
);

UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user',
});

UserSchema.methods.generateToken = async function () {
  const user = this;
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_STRING, {
    expiresIn: '2 days',
  });
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

UserSchema.methods.toLimitedJSON = function (limitLevevl) {
  const user = this;
  const userObject = user.toObject({ virtuals: true });

  if (user.settings.hideWhenMade) {
    delete userObject.createdAt;
  }
  delete userObject.password;
  delete userObject.formerPasswords;
  delete userObject.__v;
  delete userObject._id;
  if (limitLevevl >= 1) {
    delete userObject.tokens;
    delete userObject.settings;
    delete userObject.email;
  }
  if (limitLevevl >= 2) {
    delete userObject.updatedAt;
    delete userObject.createdAt;
  }
  return userObject;
};

UserSchema.statics.verifyParameters = async function (req) {
  const errors = {};
  const reqKeys = Object.keys(req.body);

  for (let i = 0; i < reqKeys.length; i++) {
    const key = reqKeys[i];
    const errorKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (key === 'newPassword') {
      for (let j = 0; j < req.user.formerPasswords.length; j++) {
        const keyPass = req.user.formerPasswords[j];
        if (await bcrypt.compare(req.body[key], keyPass)) {
          errors.password = [
            'verification',
            'Password was formally used, use another.',
          ];
        }
      }
    }
    if (req.user[key] === req.body[key]) {
      errors[key] = [
        'verification',
        `${errorKey} is being currently used, try another.`,
      ];
    }
  }
  if (Object.keys(errors).length) {
    throw new ErrorArray(errors, 'VerificationError');
  }
};

UserSchema.statics.verifyCredentials = async function (email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ErrorArray(
      { email: [['Verification', 'Invalid email.']] },
      'VerificationError'
    );
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new ErrorArray(
      { password: [['Verification', 'Incorrect password.']] },
      'VerificationError'
    );
  }
  return user;
};

UserSchema.statics.verifyPassword = async function (user, password) {
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new ErrorArray(
      { password: [['Verification', 'Incorrect password.']] },
      'VerificationError'
    );
  }
  return;
};

UserSchema.pre('remove', async function (next) {
  const user = this;
  await user.populate('posts');
  for (const postID of user.posts) {
    const post = await PostModel.findById(postID);
    await post.remove();
  }
  next();
});

UserSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    const hashedPassword = await bcrypt.hash(user.password, 8);
    user.formerPasswords.push(hashedPassword);
    user.password = hashedPassword;
  }
  next();
});

// Add any plug-ins there are
UserSchema.plugin(uniqueValidator, { message: 'dupe' });

// Export model
const User = mongoose.model('User', UserSchema);
export default User;
