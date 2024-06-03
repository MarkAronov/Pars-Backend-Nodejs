/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */

// Import necessary modules and dependencies
import mongoose, {
  CallbackWithoutResultAndOptionalError as NextFunction,
} from 'mongoose';
import fs from 'fs';
import path from 'path';
import jwt, { Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import uniqueValidator from 'mongoose-unique-validator'; // Plugin for unique field validation

// Import models and utilities
import { Post } from './postsModel.js';
import {
  IUser,
  IUserMethods,
  IUserVirtuals,
  UserModel,
  UserType,
} from '../types/index.js'; // Custom types
import {
  ErrorAO,
  dirName,
  emailChecker,
  passwordChecker,
  usernameChecker,
} from '../utils/index.js';

// Define schema options
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

// Define the user schema
const UserSchema = new mongoose.Schema<
  IUser,
  UserModel,
  IUserMethods,
  {},
  IUserVirtuals
>(
  {
    // Define user fields with type, constraints, and validation
    username: {
      type: String,
      unique: true,
      required: true,
      maxLength: [64, 'Username is longer than 64 characters.'],
      trim: true,
      async validate(value: string | undefined) {
        let usernameErrors: string[] = [];
        usernameErrors = usernameChecker(value); // Custom validation for username
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
        emailErrors = emailChecker(value); // Custom validation for email
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
        passwordErrorsList = passwordChecker(value); // Custom validation for password
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
    formerPasswords: [String], // Stores hashed former passwords
  },
  schemaOptions,
);

// Index fields for full-text search
UserSchema.index({ username: 'text', displayName: 'text' });

// Define virtual property for user posts
UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user',
});

// Method to generate JWT token for user authentication
UserSchema.method(
  'generateToken',
  async function generateToken(this: UserType) {
    const token = jwt.sign(
      { id: this._id.toString() },
      process?.env?.['JWT_STRING'] as Secret,
    );
    this.tokens = this?.tokens?.concat({ token }) as { token?: string }[];
    await this.save();
    return token;
  },
);

// Method to limit user data for JSON response
UserSchema.method(
  'toLimitedJSON',
  function toLimitedJSON(this: UserType, limitLevel: number) {
    const userObject: UserType = this.toObject({ virtuals: true });
    if (userObject.settings?.hideWhenMade) delete userObject.createdAt;
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

// Method to verify user password
UserSchema.method(
  'verifyPassword',
  async function verifyPassword(password: string) {
    const match = await bcrypt.compare(password, this.password as string);
    if (!match)
      throw new ErrorAO(
        { password: ['Incorrect password.'] },
        'VerificationError',
      );
    return;
  },
);

// Static method to verify user credentials
UserSchema.static(
  'verifyCredentials',
  async (email: string, password: string) => {
    const user = await User.findOne({ email });
    if (!user)
      throw new ErrorAO({ email: ['Invalid email.'] }, 'VerificationError');

    const match = await bcrypt.compare(password, user.password as string);
    if (!match)
      throw new ErrorAO(
        { password: ['Incorrect password.'] },
        'VerificationError',
      );
    return user;
  },
);

// Middleware to handle pre-delete operations
UserSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function preRemove(this: UserType, next: NextFunction) {
    await this.populate('posts');
    for (const postID of this.posts) {
      const post = await Post.findById(postID);
      await post?.deleteOne();
    }
    const fileFolderPath = path.join(dirName(), '../../media/');
    if (this.avatar)
      await fs.rm(`${fileFolderPath}/avatars/${this.avatar}`, () => {});
    if (this.backgroundImage)
      await fs.rm(
        `${fileFolderPath}/backgroundImages/${this.backgroundImage}`,
        () => {},
      );
    next();
  },
);

// Middleware to handle pre-save operations
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

// Apply uniqueValidator plugin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
UserSchema.plugin(uniqueValidator as any, { message: 'dupe' });

// Export the user model
export const User = mongoose.model<IUser, UserModel>('User', UserSchema);
