import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app";
import { User } from "../../src/models";

describe("User Login", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "loginUserTest",
		email: "loginUserTest@testing.com",
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
			.field(
				"content",
				JSON.stringify({
					email: "loginUserTest@testing.com",
					password: "Password123",
				}),
			);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("user");
		expect(response.body).toHaveProperty("token");
	});

	it("should not log in a user with a wrong email", async () => {
		const response = await request(app)
			.post("/user/login")
			.field(
				"content",
				JSON.stringify({
					email: "false@testing.com",
					password: "Password123",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			email: ["Invalid email."],
		});
	});

	it("should not log in a user with a wrong password", async () => {
		const response = await request(app)
			.post("/user/login")
			.field(
				"content",
				JSON.stringify({
					email: "loginUserTest@testing.com",
					password: "Password12345678",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Incorrect password."],
		});
	});

	it("should not log in a user with a missing email", async () => {
		const response = await request(app)
			.post("/user/login")
			.field(
				"content",
				JSON.stringify({
					password: "Password123",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			email: ["email is missing and it's needed"],
		});
	});

	it("should not log in a user with a missing password", async () => {
		const response = await request(app)
			.post("/user/login")
			.field(
				"content",
				JSON.stringify({
					email: "loginUserTest@testing.com",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["password is missing and it's needed"],
		});
	});

	it("should not log in a user due to missing all of the requested fields", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("content", JSON.stringify({}));

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			MAIN: ["Missing all required parameters (email, password)."],
		});
	});
});