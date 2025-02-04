import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { User } from "../../../src/api/user/user.model";
import app from "../../../src/app";

describe("User Logout", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "logoutUserTest",
		email: "logoutUserTest@testing.com",
		password: "Password123@",
		_id: userID,
		tokens: [
			{
				token: jwt.sign(
					{ id: userID },
					process.env.JWT_STRING || "default_jwt_secret",
					{
						expiresIn: "14d",
					},
				),
			},
		],
	};

	beforeEach(async () => {
		await User.deleteMany();
		const user = new User(testUser);
		await user.save();
	});

	it("should log out a user", async () => {
		const token = testUser.tokens[0].token;
		const response = await request(app)
			.post("/user/logout")
			.set("Authorization", `Bearer ${token}`)
			.send();

		expect(response.status).toBe(200);

		// Verify token no longer works
		const verifyResponse = await request(app)
			.get("/user/self")
			.set("Authorization", `Bearer ${token}`);

		expect(verifyResponse.status).toBe(401);

		const user = await User.findById(testUser._id);
		expect(user?.tokens?.length).toBe(0);
	});

	it("should not log out a user without authorization", async () => {
		const response = await request(app).post("/user/logout").send();

		expect(response.status).toBe(401);
	});

	it("should not log out a user with an invalid token", async () => {
		const response = await request(app)
			.post("/user/logout")
			.set("Authorization", "Bearer invalidtoken")
			.send();

		expect(response.status).toBe(401);
	});

	describe("User Logout All", () => {
		it("should log out a user from all tokens", async () => {
			const token = testUser.tokens[0].token;
			const response = await request(app)
				.post("/user/logoutAll")
				.set("Authorization", `Bearer ${token}`)
				.send();

			expect(response.status).toBe(200);

			// Verify token no longer works
			const verifyResponse = await request(app)
				.get("/user/self")
				.set("Authorization", `Bearer ${token}`);

			expect(verifyResponse.status).toBe(401);

			const user = await User.findById(testUser._id);
			expect(user?.tokens?.length).toBe(0);
		});

		it("should not log out a user from all tokens without authorization", async () => {
			const response = await request(app).post("/user/logoutAll").send();

			expect(response.status).toBe(401);
		});

		it("should not log out a user from all tokens with an invalid token", async () => {
			const response = await request(app)
				.post("/user/logoutAll")
				.set("Authorization", "Bearer invalidtoken")
				.send();

			expect(response.status).toBe(401);
		});
	});
});
