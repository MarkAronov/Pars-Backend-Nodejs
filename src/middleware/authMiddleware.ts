import type { NextFunction, Response } from "express";
import jsonwebtoken, { type Secret } from "jsonwebtoken";
import { User } from "src/api/user/user.model";
import type { Request } from "src/commom/generalTypes";
import { ErrorAO, wrap } from "src/utils/generalUtils";

/**
 * Middleware function for authenticating a user via a JWT token.
 * Throws an authentication error if the token is missing, invalid, or if the user is not found.
 */
export const authMiddleware = wrap(
	async (req: Request, res: Response, next: NextFunction) => {
		// Check if the Authorization header is present
		if (!req.header("Authorization")) {
			throw new ErrorAO(
				{ MAIN: ["Authenticate method is invalid"] },
				"AuthenticationError",
				401,
			);
		}

		// Extract the token from the Authorization header
		const encodedToken = req
			.header("Authorization")
			?.replace("Bearer ", "") as string;

		let decodedToken: jsonwebtoken.JwtPayload;

		try {
			// Verify the token using the secret key from environment variables
			decodedToken = jsonwebtoken.verify(
				encodedToken,
				process.env.JWT_STRING as Secret,
			) as jsonwebtoken.JwtPayload;
		} catch (e) {
			// Throw an error if the token is invalid
			throw new ErrorAO(
				{ MAIN: ["Invalid token"] },
				"AuthenticationError",
				401,
			);
		}

		// Find the user associated with the token
		console.log(decodedToken.id);
		const user = await User.findOne({
			_id: decodedToken.id as string,
			"sessions.token": encodedToken,
		});

		// Throw an error if the user is not found
		if (!user) {
			throw new ErrorAO(
				{ MAIN: ["Authenticate first"] },
				"AuthenticationError",
				401,
			);
		}

		// Attach the token and user to the request object
		req.token = encodedToken as string;
		req.user = user;

		// Proceed to the next middleware
		next();
	},
);
