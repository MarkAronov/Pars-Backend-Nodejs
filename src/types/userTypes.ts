import type { Request } from "express";
import type {
	HydratedDocument,
	Model,
	Date as MongooseDate,
	Schema,
} from "mongoose";
import type { PostType } from "./postTypes";
// User Related Types

// Define the user schema interface
export interface IUser {
	username?: string;
	displayName?: string;
	email?: string;
	password?: string;
	bio?: string | null;
	verified?: boolean;
	verificationToken?: string;
	verificationTokenExpires?: Date;
	passwordResetToken?: string;
	role?: "user" | "moderator" | "admin";
	sessions: {
		token: string;
		createdAt: Date;
		userAgent: string;
		ipAddress?: string;
		deviceInfo?: string;
		location?: string;
		expiresAt?: Date;
	}[];
	avatar?: string | null;
	backgroundImage?: string | null;
	settings?: { hideWhenMade?: boolean; hidePosts?: boolean };
	formerPasswords?: string[]; // Stores hashed passwords
	createdAt?: MongooseDate;
	updatedAt?: MongooseDate;
	schemaVersion?: number;
}

// Define virtual properties for the user schema
export interface IUserVirtuals {
	posts: PostType[]; // Array of user's posts
}

// Define methods for the user schema
export interface IUserMethods {
	generateToken(req: Request): Promise<string>; // Generates a JWT token
	toLimitedJSON(
		limitLevel: number,
	): HydratedDocument<IUser, IUserMethods & IUserVirtuals>; // Returns user data with limited fields
	verifyPassword(currentPassword: string): null; // Verifies user password
}

// Define the user model interface
export interface UserModel
	extends Model<IUser, Record<string, never>, IUserMethods, IUserVirtuals> {
	verifyCredentials(
		email: string,
		password: string,
	): Promise<
		HydratedDocument<
			IUser & Required<{ _id: Schema.Types.ObjectId }>,
			IUserMethods & IUserVirtuals
		>
	>; // Verifies user credentials
}

export type UserType = HydratedDocument<IUser, IUserMethods & IUserVirtuals>;

export type UserMediaTypeKeys = "avatar" | "backgroundImage";

export type UserPartialDeleteTypeKeys = "bio" | "avatar" | "backgroundImage";

export type UserRegularPatchTypeKeys =
	| "displayName"
	| "bio"
	| "avatar"
	| "backgroundImage"
	| "settings";

export type UserOptionalTypeKeys = "bio";
