import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app";
import { User } from "../../../src/api/user/user.model";

describe("User Delete", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "deleteUserTest",
		email: "deleteUserTest@testing.com",
		password: "Password123@",
		_id: userID,
		sessions: [
			{
				token: jwt.sign(
					{ id: userID },
					process.env.JWT_STRING || "default_jwt_secret",
					{ expiresIn: "14d" },
				),
			},
		],
	};

	beforeEach(async () => {
		await User.deleteMany();
		await new User(testUser).save();
	});

	it("should delete a user", async () => {
		const response = await request(app)
			.delete("/user")
			.set("Authorization", `Bearer ${testUser.sessions[0].token}`);
		expect(response.status).toBe(200);
		const userExists = await User.findById(userID);
		expect(userExists).toBeNull();

		// Verify token no longer works
		const loginResponse = await request(app)
			.post("/user/login")
			.field("email", "deleteUserTest@testing.com")
			.field("password", "Password123");
		const token = loginResponse.body.token;
		const verifyResponse = await request(app)
			.get("/user/self")
			.set("Authorization", `Bearer ${token}`);

		expect(verifyResponse.status).toBe(401);
	});

	it("should not delete a user if unauthorized", async () => {
		const response = await request(app).delete("/user");
		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("ERROR");
	});

	it("should not delete a user with invalid token", async () => {
		const response = await request(app)
			.delete("/user")
			.set("Authorization", "Bearer invalid_token");
		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("ERROR");
	});

	it("should fail if user doesn't exist", async () => {
		await User.deleteMany(); // remove user from DB
		const loginResponse = await request(app)
			.post("/user/login")
			.field("email", "deleteUserTest@testing.com")
			.field("password", "Password123");
		const token = loginResponse.body.token;
		const response = await request(app)
			.delete("/user")
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(401);
	});

	it("should fail with missing token claims", async () => {
		const invalidToken = jwt.sign(
			{},
			process.env.JWT_STRING || "default_jwt_secret",
			{
				expiresIn: "14d",
			},
		);
		const response = await request(app)
			.delete("/user")
			.set("Authorization", `Bearer ${invalidToken}`);
		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("ERROR");
	});
});
