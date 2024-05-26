/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */
import mongoose, {
  CallbackWithoutResultAndOptionalError as NextFunction,
} from 'mongoose';
import fs from 'fs';
import path from 'path';
import jwt, { Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import uniqueValidator from 'mongoose-unique-validator';

import { Post } from './postsModel.js';
import * as utils from '../utils/utils.js';

import ErrorAO from '../utils/ErrorAO.js';
import { PostType, UserType } from 'src/utils/types.js';

export interface IUser {
  username?: string;
  displayName?: string;
  email?: string;
  password?: string;
  bio?: string | null;
  tokens?:
    | {
        token?: string | null;
      }[]
    | null;
  avatar?: string | null;
  backgroundImage?: string | null;
  settings?: {
    hideWhenMade?: boolean;
    hidePosts?: boolean;
  };
  formerPasswords?: string[];
  createdAt?: mongoose.Date;
  updatedAt?: mongoose.Date;
}

export interface IUserVirtuals {
  posts: PostType[];
}

export interface IUserMethods {
  generateToken(): string;
  toLimitedJSON(
    limitLevel: number,
  ): mongoose.HydratedDocument<IUser, IUserMethods & IUserVirtuals>;
  verifyPassword(currentPassword: string): null;
}

export interface UserModel
  extends mongoose.Model<IUser, {}, IUserMethods, IUserVirtuals> {
  verifyCredentials(
    email: string,
    password: string,
  ): Promise<
    mongoose.HydratedDocument<
      IUser & Required<{ _id: mongoose.Schema.Types.ObjectId }>,
      IUserMethods & IUserVirtuals
    >
  >;
}

const schemaOptions: object = {
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
  timestamps: true,
  id: false,
};

const UserSchema = new mongoose.Schema<
  IUser,
  UserModel,
  IUserMethods,
  {},
  IUserVirtuals
>(
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
      es_indexed: true,
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
  schemaOptions,
);

UserSchema.index({ username: 'text', displayName: 'text' });

UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user',
});

UserSchema.method(
  'generateToken',
  async function generateToken(this: UserType) {
    const token = jwt.sign(
      { id: this._id.toString() },
      process?.env?.['JWT_STRING'] as Secret,
    );
    this.tokens = this?.tokens?.concat({ token }) as {
      token?: string;
    }[];
    await this.save();
    return token;
  },
);

UserSchema.method(
  'toLimitedJSON',
  function toLimitedJSON(this: UserType, limitLevel: number) {
    const userObject: UserType = this.toObject({ virtuals: true });
    if (userObject.settings?.hideWhenMade) {
      delete userObject.createdAt;
    }
    delete userObject.password;
    delete userObject.formerPasswords;
    delete userObject.__v;
    if (limitLevel >= 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (userObject as any)._id;
      delete userObject.tokens;
      delete userObject.settings;
      delete userObject.email;
    }
    if (limitLevel >= 2) {
      delete userObject.updatedAt;
      delete userObject.createdAt;
    }
    return userObject;
  },
);

UserSchema.method(
  'verifyPassword',
  // eslint-disable-next-line prefer-arrow-callback
  async function verifyPassword(password: string) {
    const match = await bcrypt.compare(password, this.password as string);
    if (!match) {
      throw new ErrorAO(
        { password: ['Incorrect password.'] },
        'VerificationError',
      );
    }
    return;
  },
);

UserSchema.static(
  'verifyCredentials',
  // eslint-disable-next-line prefer-arrow-callback
  async function verifyCredentials(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ErrorAO({ email: ['Invalid email.'] }, 'VerificationError');
    }

    const match = await bcrypt.compare(password, user.password as string);
    if (!match) {
      throw new ErrorAO(
        { password: ['Incorrect password.'] },
        'VerificationError',
      );
    }
    return user;
  },
);

UserSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function preRemove(this: UserType, next: NextFunction) {
    await this.populate('posts');
    for (const postID of this.posts) {
      const post = await Post.findById(postID);
      await post?.deleteOne();
    }
    const fileFolderPath = path.join(utils.dirName(), '../../media/');
    if (this.avatar) {
      await fs.rm(`${fileFolderPath}/avatars/${this.avatar}`, () => {});
    }
    if (this.backgroundImage) {
      await fs.rm(
        `${fileFolderPath}/backgroundImages/${this.backgroundImage}`,
        () => {},
      );
    }
    next();
  },
);

UserSchema.pre(
  'save',
  async function preSave(this: UserType, next: NextFunction) {
    if (this.isModified('password')) {
      const hashedPassword = await bcrypt.hash(this.password as string, 8);
      this.formerPasswords?.push(hashedPassword as unknown as string);
      this.password = hashedPassword;
    }
    next();
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
UserSchema.plugin(uniqueValidator as any, { message: 'dupe' });

// Export model
export const User = mongoose.model<IUser, UserModel>('User', UserSchema);
