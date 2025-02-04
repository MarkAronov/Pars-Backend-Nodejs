import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { User } from "../../../src/api/user/user.model";
import app from "../../../src/app";
import { cleanupUploads } from "../../cleanup";

describe("User Patch Regular Fields", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "patchUserTest",
		email: "patchUserTest@testing.com",
		password: "Password123@",
		displayName: "Original Name",
		bio: "Original Bio",
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
		await cleanupUploads();
		const user = new User(testUser);
		await user.save();

		// Verify user exists before tests
		const savedUser = await User.findById(userID);
		if (!savedUser) {
			throw new Error("Test user not saved properly");
		}
	});

	afterAll(async () => {
		await cleanupUploads();
	});

	it("should update user's display name", async () => {
		const response = await request(app)
			.patch("/user/profile") // Changed endpoint
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.send({ displayName: "New Display Name" }); // Changed to send JSON

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("displayName", "New Display Name");

		const updatedUser = await User.findById(userID);
		expect(updatedUser?.displayName).toBe("New Display Name");
	});

	it("should update user's bio", async () => {
		const response = await request(app)
			.patch("/user")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("bio", "New bio text");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("bio", "New bio text");

		const updatedUser = await User.findById(userID);
		expect(updatedUser?.bio).toBe("New bio text");
	});

	it("should update multiple fields at once", async () => {
		const response = await request(app)
			.patch("/user")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("displayName", "New Name")
			.field("bio", "New Bio");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("displayName", "New Name");
		expect(response.body).toHaveProperty("bio", "New Bio");
	});

	it("should not update with invalid token", async () => {
		const response = await request(app)
			.patch("/user")
			.set("Authorization", "Bearer invalid_token")
			.field("displayName", "New Name");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("ERROR");
	});

	it("should not update without authorization", async () => {
		const response = await request(app)
			.patch("/user")
			.field("displayName", "New Name");

		expect(response.status).toBe(401);
		expect(response.body).toHaveProperty("ERROR");
	});

	it("should validate display name length", async () => {
		const response = await request(app)
			.patch("/user")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("displayName", "a".repeat(51)); // Assuming max length is 50

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR");
	});

	it("should validate bio length", async () => {
		const response = await request(app)
			.patch("/user")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("bio", "a".repeat(301)); // Assuming max length is 300

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR");
	});
});
