import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { beforeEach } from "vitest";
import { User } from "../../../src/api/user/user.model";
import app from "../../../src/app";

describe("Get User", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "getUserTest",
		email: "getUserTest@testing.com",
		password: "Password123@",
		displayName: "Test User",
		bio: "Test bio",
		_id: userID,
		tokens: [
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

	it("should get user by username", async () => {
		const response = await request(app).get(`/user/${testUser.username}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("username", testUser.username);
		expect(response.body).toHaveProperty("displayName", testUser.displayName);
		expect(response.body).toHaveProperty("bio", testUser.bio);
		expect(response.body).not.toHaveProperty("email");
		expect(response.body).not.toHaveProperty("password");
	});

	it("should return 404 for non-existent username", async () => {
		const response = await request(app).get("/user/nonexistentuser");

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty("ERROR");
	});

	it("should handle invalid username format", async () => {
		const response = await request(app).get("/user/invalid@username");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR");
	});
});
