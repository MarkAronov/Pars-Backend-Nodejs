import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { User } from "../../../src/api/user/user.model";
import app from "../../../src/app";

describe("User Important Fields Update", async () => {
	const userID = new mongoose.Types.ObjectId();
	const otherUserID = new mongoose.Types.ObjectId();

	const testUser = {
		username: "importantUpdateTest",
		email: "importantUpdate@testing.com",
		password: "Password123@",
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

	const otherUser = {
		username: "otherUser",
		email: "otheruser@testing.com",
		password: "Password123@",
		_id: otherUserID,
	};

	beforeEach(async () => {
		await User.deleteMany();
		await new User(testUser).save();
		await new User(otherUser).save();
	});

	it("should update username successfully", async () => {
		const newUsername = "newUsername123";
		const response = await request(app)
			.patch("/user/important")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("username", newUsername)
			.field("password", testUser.password);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("username", newUsername);

		// Verify database update
		const updatedUser = await User.findById(userID);
		expect(updatedUser?.username).toBe(newUsername);
	});

	it("should update email successfully", async () => {
		const newEmail = "newemail@test.com";
		const response = await request(app)
			.patch("/user/important")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("email", newEmail)
			.field("password", testUser.password);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("email", newEmail);

		// Verify database update
		const updatedUser = await User.findById(userID);
		expect(updatedUser?.email).toBe(newEmail);

		// Verify can login with new email
		const loginResponse = await request(app)
			.post("/user/login")
			.field("email", newEmail)
			.field("password", testUser.password);

		expect(loginResponse.status).toBe(200);
	});

	it("should not update without password verification", async () => {
		const response = await request(app)
			.patch("/user/important")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("username", "newUsername");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR");
	});

	it("should not update with incorrect password", async () => {
		const response = await request(app)
			.patch("/user/important")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("username", "newUsername")
			.field("password", "WrongPassword123@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR");
	});

	it("should not update to existing username", async () => {
		const response = await request(app)
			.patch("/user/important")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("username", otherUser.username)
			.field("password", testUser.password);

		expect(response.status).toBe(400);
		expect(response.body.ERROR).toHaveProperty("username");
	});

	it("should not update to existing email", async () => {
		const response = await request(app)
			.patch("/user/important")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("email", otherUser.email)
			.field("password", testUser.password);

		expect(response.status).toBe(400);
		expect(response.body.ERROR).toHaveProperty("email");
	});

	it("should validate new username format", async () => {
		const response = await request(app)
			.patch("/user/important")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("username", "invalid@username")
			.field("password", testUser.password);

		expect(response.status).toBe(400);
		expect(response.body.ERROR).toHaveProperty("username");
	});

	it("should validate new email format", async () => {
		const response = await request(app)
			.patch("/user/important")
			.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
			.field("email", "notanemail")
			.field("password", testUser.password);

		expect(response.status).toBe(400);
		expect(response.body.ERROR).toHaveProperty("email");
	});

	it("should require authentication", async () => {
		const response = await request(app)
			.patch("/user/important")
			.field("username", "newUsername")
			.field("password", testUser.password);

		expect(response.status).toBe(401);
	});
});
