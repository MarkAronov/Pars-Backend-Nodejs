import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app";
import { User } from "../../../src/api/user/user.model";

describe("User Login", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "loginUserTest",
		email: "loginUserTest@testing.com",
		password: "Password123@",
		_id: userID,
		sessions: [{
			token: jwt.sign(
				{ id: userID },
				process.env.JWT_STRING || "default_jwt_secret",
				{
					expiresIn: "14d",
				},
			),
		}],
	};

	beforeEach(async () => {
		await User.deleteMany();
		const user = new User(testUser);
		await user.save();
	});

	it("should log in a user", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("email", testUser.email)
			.field("password", testUser.password);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("user");
		expect(response.body).toHaveProperty("token");

		// Verify token works with an authenticated endpoint
		const verifyResponse = await request(app)
			.get("/user/self")
			.set("Authorization", `Bearer ${response.body.token}`);
		
		expect(verifyResponse.status).toBe(200);
		expect(verifyResponse.body).toHaveProperty("username", "loginUserTest");
	});

	it("should not log in a user with a wrong email", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("email", "false@testing.com")
			.field("password", "Password123");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			email: ["Invalid email."],
		});
	});

	it("should not log in a user with a wrong password", async () => {
		const response = await request(app)
			.post("/user/login")
			.field("email", "loginUserTest@testing.com")
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
			.field("email", "loginUserTest@testing.com");

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
