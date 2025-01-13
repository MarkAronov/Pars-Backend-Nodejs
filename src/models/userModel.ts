import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt, { type Secret } from "jsonwebtoken";
// Import necessary modules and dependencies
import mongoose, {
	type CallbackWithoutResultAndOptionalError as NextFunction,
} from "mongoose";
import uniqueValidator from "mongoose-unique-validator"; // Plugin for unique field validation

import type {
	IUser,
	IUserMethods,
	IUserVirtuals,
	UserModel,
	UserType,
} from "@/types"; // Custom types
import type { Request } from "@/types";
import { ErrorAO } from "@/utils";
import _ from "lodash";
import validator from "validator";
// Import models and utilities
import { Post } from "./postModel";
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
	Record<string, never>,
	IUserVirtuals
>(
	{
		// Define user fields with type, constraints, and validation
		username: {
			type: String,
			unique: true,
			required: true,
			maxLength: [64, "Username is longer than 64 characters."],
			trim: true,
			async validate(value: string) {
				const usernameErrors = [];

				if (validator.contains(value, " "))
					usernameErrors.push("Username contains whitespace");
				if (!value.match(/^[0-9a-zA-Z\s]+$/))
					usernameErrors.push("Username contains non-alphanumeric characters");
				if (usernameErrors.length)
					throw new ErrorAO(usernameErrors, "username");
			},
		},
		displayName: {
			type: String,
			maxLength: [128, "Display Name is longer than 128 characters."],
			default: "",
			trim: true,
		},
		email: {
			type: String,
			unique: true,
			required: true,
			maxLength: [254, "Email is longer than 254 characters."],
			lowercase: true,
			trim: true,
			async validate(value: string) {
				if (!validator.isEmail(value))
					throw new ErrorAO(["Invalid email"], "email");
			},
		},
		password: {
			type: String,
			required: true,
			maxLength: 254,
			async validate(value: string) {
				const passwordErrorsList = [];
				if (value.length < 10)
					passwordErrorsList.push("Must be at least 8 characters.");
				if (!/[A-Z]/.test(value))
					passwordErrorsList.push("Must contain an uppercase letter.");
				if (!/\d/.test(value)) passwordErrorsList.push("Must contain a digit.");
				// if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
				// 	passwordErrorsList.push("Must contain a special character.");

				if (passwordErrorsList.length)
					throw new ErrorAO(passwordErrorsList, "password");
			},
		},
		bio: {
			type: String,
			maxLength: [400, "Bio is longer than 400 characters."],
			default: "",
			trim: true,
		},
		role: {
			type: String,
			enum: ["user", "moderator", "admin"],
			default: "user",
		},
		sessions: [
			{
				token: {
					type: String,
					required: true,
				},
				createdAt: {
					type: Date,
					default: Date.now,
					required: true,
				},
				userAgent: {
					type: String,
					required: true,
				},
				ipAddress: {
					type: String,
					default: null,
				},
				expiresAt: {
					type: Date,
					default: null,
				},
				deviceInfo: {
					type: String,
					default: null,
				},
				location: {
					type: String,
					default: null,
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
UserSchema.index({ username: "text", displayName: "text" });

// Define virtual property for user posts
UserSchema.virtual("posts", {
	ref: "Post",
	localField: "_id",
	foreignField: "user",
});

// Method to generate JWT token for user authentication
UserSchema.method(
	"generateToken",
	async function generateToken(this: UserType, req: Request) {
		const token = jwt.sign(
			{ id: (this._id as unknown as string).toString() },
			process?.env?.JWT_STRING as Secret,
		);
		this.sessions = (Array.isArray(this.sessions) ? this.sessions : []).concat({
			token,
			createdAt: new Date(),
			userAgent: req.headers["user-agent"] || "unknown",
			ipAddress: req.ip,
			deviceInfo: req.headers["device-info"] || "unknown",
			location: req.headers.location || "unknown",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
		}) as {
			token: string;
			createdAt: Date;
			userAgent: string;
			ipAddress?: string;
			deviceInfo?: string;
			location?: string;
			expiresAt?: Date;
		}[];
		await this.save();
		return token;
	},
);

// Method to limit user data for JSON response

UserSchema.method(
	"toLimitedJSON",
	function toLimitedJSON(this: UserType, limitLevel: number) {
		let userObject = this.toObject({ virtuals: true }) as unknown as UserType;
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
			userObject = _.omit(userObject, [
				"_id",
				"sessions",
				"settings",
				"email",
			]) as UserType;
		}
		if (limitLevel >= 2) {
			userObject = _.omit(userObject, ["updatedAt", "createdAt"]) as UserType;
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
	async function preRemove(this: UserType, next: NextFunction) {
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
	async function preSave(this: UserType, next: NextFunction) {
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
