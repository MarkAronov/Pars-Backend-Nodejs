import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { User } from "../../../src/api/user/user.model";
import app from "../../../src/app";
import { cleanupUploads } from "../../cleanup";

describe("User Delete Partial", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testImagePath = path.join(process.cwd(), "/__tests__/assets");
	const uploadPath = path.join(process.cwd(), "/media");

	const testUser = {
		username: "deleteUserPartialTest",
		email: "deleteUserPartialTest@testing.com",
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

	beforeEach(async () => {
		await User.deleteMany();
		await cleanupUploads();
		await new User(testUser).save();
	});

	afterAll(async () => {
		await cleanupUploads();
	});

	describe("Avatar Deletion", () => {
		it("should delete user's avatar", async () => {
			// First upload an avatar
			const uploadResponse = await request(app)
				.patch("/user")
				.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
				.attach("avatar", path.join(testImagePath, "1.png"));

			expect(uploadResponse.status).toBe(200);
			const avatarFilename = uploadResponse.body.avatar;

			// Then delete it
			const deleteResponse = await request(app)
				.delete("/user/avatar")
				.set("Authorization", `Bearer ${testUser.tokens[0].token}`);

			expect(deleteResponse.status).toBe(200);

			// Verify avatar file is deleted
			const avatarExists = fs.existsSync(
				path.join(uploadPath, "avatar", avatarFilename),
			);
			expect(avatarExists).toBe(false);

			// Verify user document is updated
			const user = await User.findById(userID);
			expect(user?.avatar).toBeNull();
		});

		it("should return 404 when deleting non-existent avatar", async () => {
			const response = await request(app)
				.delete("/user/avatar")
				.set("Authorization", `Bearer ${testUser.tokens[0].token}`);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ ERROR: "No avatar to delete" });
		});
	});

	describe("Background Image Deletion", () => {
		it("should delete user's background image", async () => {
			// First upload a background image
			const uploadResponse = await request(app)
				.patch("/user")
				.set("Authorization", `Bearer ${testUser.tokens[0].token}`)
				.attach("backgroundImage", path.join(testImagePath, "2.png"));

			expect(uploadResponse.status).toBe(200);
			const backgroundFilename = uploadResponse.body.backgroundImage;

			// Then delete it
			const deleteResponse = await request(app)
				.delete("/user/background")
				.set("Authorization", `Bearer ${testUser.tokens[0].token}`);

			expect(deleteResponse.status).toBe(200);

			// Verify background image file is deleted
			const backgroundExists = fs.existsSync(
				path.join(uploadPath, "backgroundImage", backgroundFilename),
			);
			expect(backgroundExists).toBe(false);

			// Verify user document is updated
			const user = await User.findById(userID);
			expect(user?.backgroundImage).toBeNull();
		});

		it("should return 404 when deleting non-existent background image", async () => {
			const response = await request(app)
				.delete("/user/background")
				.set("Authorization", `Bearer ${testUser.tokens[0].token}`);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ ERROR: "No background image to delete" });
		});
	});

	describe("Authentication Tests", () => {
		it("should not delete avatar without authorization", async () => {
			const response = await request(app).delete("/user/avatar");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("ERROR");
		});

		it("should not delete background without authorization", async () => {
			const response = await request(app).delete("/user/background");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("ERROR");
		});

		it("should not delete with invalid token", async () => {
			const response = await request(app)
				.delete("/user/avatar")
				.set("Authorization", "Bearer invalid_token");

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("ERROR");
		});

		it("should not delete with expired token", async () => {
			const expiredToken = jwt.sign(
				{ id: userID },
				process.env.JWT_STRING || "default_jwt_secret",
				{ expiresIn: "0s" },
			);

			const response = await request(app)
				.delete("/user/avatar")
				.set("Authorization", `Bearer ${expiredToken}`);

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("ERROR");
		});
	});
});
