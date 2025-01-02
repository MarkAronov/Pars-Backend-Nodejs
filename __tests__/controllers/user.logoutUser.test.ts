import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app";
import { User } from "../../src/models";

describe("User Login", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "logoutUserTest",
		email: "logoutUserTest@testing.com",
		password: "Password123",
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
		await new User(testUser).save();
	});

	it("should log in a user", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("email", "logoutUserTest@testing.com")
			.field("password", "Password123");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("user");
		expect(response.body).toHaveProperty("token");
	});

	it("should not log in a user with a wrong email", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("email", "test@testing.com")
			.field("password", "Password123");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			email: ["Invalid email."],
		});
	});

	it("should not log in a user with a wrong password", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("email", "logoutUserTest@testing.com")
			.field("password", "Password12345678");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Incorrect password."],
		});
	});

	it("should not log in a user with a missing email", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("password", "Password123");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			email: ["email is missing and it's needed"],
		});
	});

	it("should not log in a user with a missing password", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("email", "logoutUserTest@testing.com");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["password is missing and it's needed"],
		});
	});

	it("should not log in a user due to missing all of the requested fields", async () => {
		const response = await request(app).post("/user/login");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			MAIN: ["Missing all required parameters (email, password)."],
		});
	});
});

describe("User Logout", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "logoutUserTest",
		email: "logoutUserTest@testing.com",
		password: "Password123",
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
		await new User(testUser).save();
	});

	it("should log out a user", async () => {
		const token = testUser.tokens[0].token;
		const response = await request(app)
			.post("/user/logout")
			.set("Authorization", `Bearer ${token}`)
			.send();

		expect(response.status).toBe(200);

		const user = await User.findById(testUser._id);
		expect((user?.tokens as { token: string }[]).length).toBe(0);
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
		it("should log out a user from all sessions", async () => {
			const token = testUser.tokens[0].token;
			const response = await request(app)
				.post("/user/logoutAll")
				.set("Authorization", `Bearer ${token}`)
				.send();

			expect(response.status).toBe(200);

			const user = await User.findById(testUser._id);
			expect((user?.tokens as { token: string }[]).length).toBe(0);
		});

		it("should not log out a user from all sessions without authorization", async () => {
			const response = await request(app).post("/user/logoutAll").send();

			expect(response.status).toBe(401);
		});

		it("should not log out a user from all sessions with an invalid token", async () => {
			const response = await request(app)
				.post("/user/logoutAll")
				.set("Authorization", "Bearer invalidtoken")
				.send();

			expect(response.status).toBe(401);
		});
	});
});
