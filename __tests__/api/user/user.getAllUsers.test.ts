import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { User } from "../../../src/api/user/user.model";
import app from "../../../src/app";

describe("Get All Users", async () => {
	const testUsers = [
		{
			username: "user1",
			email: "user1@test.com",
			password: "Password123@",
			displayName: "User One",
			bio: "Bio for user one",
			avatar: null,
			backgroundImage: null,
			tokens: [],
		},
		{
			username: "user2",
			email: "user2@test.com",
			password: "Password123@",
			displayName: "User Two",
			bio: "Bio for user two",
			avatar: null,
			backgroundImage: null,
			tokens: [],
		},
		{
			username: "user3",
			email: "user3@test.com",
			password: "Password123@",
			displayName: "User Three",
			bio: "Bio for user three",
			avatar: null,
			backgroundImage: null,
			tokens: [],
		},
		{
			username: "other1",
			email: "other1@test.com",
			password: "Password123@",
			displayName: "Other One",
			bio: "Bio for other one",
			avatar: null,
			backgroundImage: null,
			tokens: [],
		},
	];

	beforeEach(async () => {
		await User.deleteMany();
		const users = await User.insertMany(testUsers);
		// Add token to first user for authentication
		const token = jwt.sign(
			{ id: users[0]._id },
			process.env.JWT_STRING || "default_jwt_secret",
			{ expiresIn: "14d" },
		);
		testUsers[0].tokens = [{ token }];
		await users[0].save();
	});

	it("should get all users with default pagination", async () => {
		const response = await request(app)
			.get("/user/all")
			.set("Authorization", `Bearer ${testUsers[0].tokens[0].token}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("users");
		expect(response.body.users).toHaveLength(4);
		expect(response.body).toHaveProperty("total");
		expect(response.body.total).toBe(4);
	});

	it("should paginate users correctly", async () => {
		const response = await request(app)
			.get("/user/all?page=1&limit=2")
			.set("Authorization", `Bearer ${testUsers[0].tokens[0].token}`);

		expect(response.status).toBe(200);
		expect(response.body.users).toHaveLength(2);
		expect(response.body.total).toBe(4);
	});

	it("should filter users by username", async () => {
		const response = await request(app).get("/user/all?search=other"); // Changed endpoint

		expect(response.status).toBe(200);
		expect(response.body.users).toHaveLength(1);
		expect(response.body.users[0].username).toBe("other1");
	});

	it("should handle invalid pagination parameters", async () => {
		const response = await request(app).get("/users?page=-1&limit=0");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR");
	});
});
