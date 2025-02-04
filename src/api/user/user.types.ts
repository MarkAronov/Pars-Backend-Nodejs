import type {
	HydratedDocument,
	Model,
	Date as MongooseDate,
} from "mongoose";
import type { Request } from "../../commom/generalTypes";
import type { PostType } from "../post/post.types";

interface IToken {
	token: string;
}

export interface IUser {
	username: string;
	displayName: string;
	email: string;
	password: string;
	bio: string | null;
	verified: boolean;
	verificationToken: string;
	verificationTokenExpires: MongooseDate;
	passwordResetToken: string;
	role: "user" | "moderator" | "admin";
	tokens: IToken[];
	avatar: string | null;
	backgroundImage: string | null;
	settings?: {
		hideWhenMade?: boolean;
		hidePosts?: boolean;
		theme?: "light" | "dark";
	};
	formerPasswords?: string[];
}

export interface IUserVirtuals {
	posts: PostType[];
}

export interface IUserMethods {
	generateAuthToken(): string;
	removeToken(token: string): void;
	generateToken(req: Request): {
		token: string;
	};
	toLimitedJSON(
		limitLevel: number,
	): HydratedDocument<IUser, IUserMethods & IUserVirtuals>;
	verifyPassword(currentPassword: string): null;
}

export interface UserModel
	extends Model<IUser, Record<string, never>, IUserMethods, IUserVirtuals> {
	verifyCredentials(
		email: string,
		password: string,
	): UserType
	;
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
export type UserImortantPatchTypeKeys = "username" | "email";
export type UserOptionalTypeKeys = "bio";


