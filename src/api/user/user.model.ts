import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt, { type Secret } from "jsonwebtoken";
import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import _ from "lodash";
import { Post } from "../post/post.model";
import { ErrorAO } from "../../utils/generalUtils";
import { validateUsername, validatePassword, validateEmail } from './user.validators';
import { USERNAME_RULES, DISPLAY_NAME_MAX_LENGTH, EMAIL_MAX_LENGTH, BIO_MAX_LENGTH, TOKEN_EXPIRY } from './user.constants';
import type { 
    IUser, 
    IUserMethods, 
    IUserVirtuals, 
    UserModel, 
    UserType 
} from "./user.types";
import type { CallbackWithoutResultAndOptionalError } from 'mongoose';

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
	Record<string, never>,
	IUserVirtuals
>(
	{
		// Define user fields with type, constraints, and validation
		username: {
			type: String,
			unique: true,
			required: true,
			maxLength: [USERNAME_RULES.MAX_LENGTH, `Username is longer than ${USERNAME_RULES.MAX_LENGTH} characters.`],
			trim: true,
			validate: validateUsername
		},
		displayName: {
			type: String,
			maxLength: [DISPLAY_NAME_MAX_LENGTH, `Display Name is longer than ${DISPLAY_NAME_MAX_LENGTH} characters.`],
			default: "",
			trim: true,
		},
		email: {
			type: String,
			unique: true,
			required: true,
			maxLength: [EMAIL_MAX_LENGTH, `Email is longer than ${EMAIL_MAX_LENGTH} characters.`],
			lowercase: true,
			trim: true,
			validate: validateEmail
		},
		password: {
			type: String,
			required: true,
			maxLength: 254,
			validate: validatePassword
		},
		bio: {
			type: String,
			maxLength: [BIO_MAX_LENGTH, `Bio is longer than ${BIO_MAX_LENGTH} characters.`],
			default: "",
			trim: true,
		},
		role: {
			type: String,
			enum: ["user", "moderator", "admin"],
			default: "user",
		},
		tokens: [{
			token: {
				type: String,
				required: true
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
		verified: {
			type: Boolean,
			default: false,
		},
		verificationToken: {
			type: String,
			default: null,
		},
		verificationTokenExpires: {
			type: Date,
			default: null,
		},
		passwordResetToken: {
			type: String,
			default: null,
		},
		settings: {
			hideWhenMade: {
				type: Boolean,
				default: false,
			},
			hidePosts: {
				type: Boolean,
				default: false,
			},
			theme: {
				type: String,
				enum: ["light", "dark"],
				default: "light",
			},
		},
		formerPasswords: [String], // Stores hashed former passwords
	},
	schemaOptions,
);

// Index fields for full-text search
UserSchema.index({ username: "text", displayName: "text" });

// Define virtual property for user posts
UserSchema.virtual("posts", {
	ref: "Post",
	localField: "_id",
	foreignField: "user",
});

// Simplified token generation method
UserSchema.method(
	"generateToken",
	async function generateToken(this: UserType) {
		const token = jwt.sign(
			{ id: (this._id as unknown as string).toString() },
			process?.env?.JWT_STRING as Secret,
			{ expiresIn: TOKEN_EXPIRY }
		);

		this.tokens = this.tokens.concat({ token });
		await this.save();

		return token;
	}
);

// Add method to remove token (for logout)
UserSchema.method(
	"removeToken",
	async function removeToken(this: UserType, tokenToRemove: string) {
		this.tokens = this.tokens.filter(({ token }) => token !== tokenToRemove);
		await this.save();
	}
);

// Method to limit user data for JSON response

UserSchema.method(
	"toLimitedJSON",
	function toLimitedJSON(this: UserType, limitLevel = 1) {
		let userObject = this.toObject({ virtuals: true }) as UserType;

		if ((userObject.settings as { hideWhenMade?: boolean })?.hideWhenMade) {
			userObject = _.omit(userObject, ["createdAt"]) as UserType;
		}

		if ((userObject.settings as { hidePosts?: boolean })?.hidePosts) {
			userObject = _.omit(userObject, ["posts"]) as UserType;
		}

		userObject = _.omit(userObject, [
			"password",
			"formerPasswords",
			"__v",
		]) as UserType;

		if (limitLevel >= 1) {
			userObject = _.pick(userObject, [
				"username",
				"displayName",
				"bio",
				"avatar",
				"backgroundImage",
			]) as UserType;
		}

		return userObject;
	},
);

// Method to verify user password
UserSchema.method(
	"verifyPassword",
	async function verifyPassword(password: string) {
		const match = await bcrypt.compare(password, this.password as string);
		if (!match)
			throw new ErrorAO(
				{ password: ["Incorrect password."] },
				"VerificationError",
			);
		return;
	},
);

// Static method to verify user credentials
UserSchema.static(
	"verifyCredentials",
	async (email: string, password: string) => {
		const user = await User.findOne({ email });
		if (!user)
			throw new ErrorAO({ email: ["Invalid email."] }, "VerificationError");
		const match = await bcrypt.compare(password, user.password as string);
		if (!match)
			throw new ErrorAO(
				{ password: ["Incorrect password."] },
				"VerificationError",
			);
		return user;
	},
);

// Middleware to handle pre-delete operations
UserSchema.pre(
	"deleteOne",
	{ document: true, query: false },
	async function preRemove(this: UserType, next: CallbackWithoutResultAndOptionalError) {
		await this.populate("posts");
		for (const postID of this.posts) {
			const post = await Post.findById(postID);
			await post?.deleteOne();
		}
		const fileFolderPath = path.join(process.cwd(), "/media/");
		if (this.avatar)
			await fs.promises.rm(`${fileFolderPath}/avatar/${this.avatar}`);
		if (this.backgroundImage)
			await fs.promises.rm(
				`${fileFolderPath}/backgroundImage/${this.backgroundImage}`,
			);
		next();
	},
);

// Middleware to handle pre-save operations
UserSchema.pre(
	"save",
	async function preSave(this: UserType, next: CallbackWithoutResultAndOptionalError) {
		if (this.isModified("password")) {
			const hashedPassword = await bcrypt.hash(this.password as string, 8);
			this.formerPasswords = Array.isArray(this.formerPasswords)
				? this.formerPasswords
				: [];
			(this.formerPasswords as string[]).push(hashedPassword as string);
			this.password = hashedPassword;
		}
		next();
	},
);

// Apply uniqueValidator plugin
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
UserSchema.plugin(uniqueValidator as any, { message: "dupe" });

// Export the user model
export const User = mongoose.model<IUser, UserModel>("User", UserSchema);
