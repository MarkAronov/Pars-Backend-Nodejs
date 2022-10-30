import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import uniqueValidator from 'mongoose-unique-validator';

import { Post } from './postsModel.js';
import * as utils from '../utils/utils.js';

import ErrorAO from '../utils/ErrorAO.js';

const schemaOptions: any = {
  toJSON: {
    virtuals: true,
  },
  toObject: {
    vituals: true,
  },
  timestamps: true,
  id: false,
};

const UserSchema: mongoose.Schema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      maxLength: [64, 'Username is longer than 64 characters.'],
      trim: true,
      async validate(value: string | undefined) {
        let usernameErrors: string[] = [];
        usernameErrors = utils.usernameChecker(value);
        if (usernameErrors.length !== 0)
          throw new ErrorAO(usernameErrors, 'Username error');
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
      async validate(value: string | undefined) {
        let emailErrors = [];
        emailErrors = utils.emailChecker(value);
        if (emailErrors.length !== 0)
          throw new ErrorAO(emailErrors, 'Email error');
      },
    },
    password: {
      type: String,
      required: true,
      maxLength: 254,
      async validate(value: string | undefined) {
        let passwordErrorsList = [];
        passwordErrorsList = utils.passwordChecker(value);
        if (passwordErrorsList.length !== 0)
          throw new ErrorAO(passwordErrorsList, 'Password error');
      },
    },
    bio: {
      type: String,
      maxLength: [400, 'Bio is longer than 400 characters.'],
      default: '',
      trim: true,
    },
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

UserSchema.method('generateToken', async function generateToken() {
  const user = this;

  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_STRING!);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
});

UserSchema.method('toLimitedJSON', function toLimitedJSON(limitLevevl: number) {
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
});

UserSchema.static(
  'verifyCredentials',
  async function verifyCredentials(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ErrorAO({ email: ['Invalid email.'] }, 'VerificationError');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new ErrorAO(
        { password: ['Incorrect password.'] },
        'VerificationError'
      );
    }
    return user;
  }
);

UserSchema.static(
  'verifyPassword',
  async function verifyPassword(user: IUser, password: string) {
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new ErrorAO(
        { password: ['Incorrect password.'] },
        'VerificationError'
      );
    }
    return;
  }
);

UserSchema.pre('remove', async function preRemove(next) {
  const user: any = this;
  await user.populate('posts');
  for (const postID of user.posts) {
    const post = await Post.findById(postID);
    await post.remove();
  }
  const fileFolderPath = path.join(utils.dirName(), `../../media/`);
  if (this.avatar) {
    await fs.rm(`${fileFolderPath}/avatars/${user.avatar}`, () => {});
  }
  if (this.backgroundImage) {
    await fs.rm(
      `${fileFolderPath}/backgroundImages/${user.backgroundImage}`,
      () => {}
    );
  }
  next();
});

UserSchema.pre('save', async function preSave(next) {
  const user: any = this;

  if (user.isModified('password')) {
    const hashedPassword = await bcrypt.hash(user.password, 8);
    user.formerPasswords.push(hashedPassword);
    user.password = hashedPassword;
  }
  next();
});

export interface IUser extends mongoose.Document {
  username: string;
  displayName: string;
  email: string;
  password: string;
  bio: string;
  tokens: {
    token: string;
  }[];
  avatar: string;
  backgroundImage: string;
  settings: {
    hideWhenMade: Boolean;
    hidePosts: Boolean;
  };
  formerPasswords: string[];
}

UserSchema.plugin(uniqueValidator, { message: 'dupe' });

interface IUserDocument extends IUser {
  generateToken(): string;
  toLimitedJSON(limitLevevl: number): typeof User;
}

export interface IUserModel extends mongoose.Model<IUserDocument> {
  verifyPassword(user: IUserModel, currentPassword: string);
  verifyCredentials(email: string, password: string): any;
}

// Export model
export const User: IUserModel = mongoose.model<IUserDocument, IUserModel>(
  'User',
  UserSchema
);
