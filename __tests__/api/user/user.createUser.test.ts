import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { request } from "superagent";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { User } from "../../../src/api/user/user.model";
import app from "../../../src/app";

describe("User Creation", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "premadeUser",
		email: "premadeUser@testing.com",
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

	const avatarRegex = /^avatar-\d{13}-[a-f0-9]{32}\.(png|jpg|gif)/;
	const backgroundImageRegex =
		/^backgroundImage-\d{13}-[a-f0-9]{32}\.(png|jpg|gif)/;
	const tokenRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

	beforeEach(async () => {
		await User.deleteMany();
		await new User(testUser).save();
	});

	it("should register a new user with the bare minimum parameters", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest@testing.com")
			.field("password", "Password12345678@");

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("user", {
			username: "createUserTest",
			displayName: "createUserTest",
			bio: "",
			avatar: null,
			backgroundImage: null,
		});
		expect(response.body).toHaveProperty("token");
		expect(response.body.token).toMatch(tokenRegex);

		// Verify user can log in
		const loginResponse = await request(app)
			.post("/user/login")
			.field("email", "createUserTest@testing.com")
			.field("password", "Password12345678@");

		expect(loginResponse.status).toBe(200);
		expect(loginResponse.body).toHaveProperty("token");

		// Verify user data is accessible
		const verifyResponse = await request(app)
			.get("/user/self")
			.set("Authorization", `Bearer ${loginResponse.body.token}`);

		expect(verifyResponse.status).toBe(200);
		expect(verifyResponse.body).toHaveProperty("username", "createUserTest");
	});

	it("should register a new user with all the parameters", async () => {
		const testImagePath = path.join(process.cwd(), "/__tests__/assets");
		const uploadPath = path.join(process.cwd(), "/media");

		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest@testing.com")
			.field("password", "Password12345678@")
			.field("displayName", "createUserTest")
			.field("bio", "yes hello")
			.attach("avatar", `${testImagePath}\\1.png`)
			.attach("backgroundImage", `${testImagePath}\\2.png`);

		const avatarFiles = fs.readdirSync(`${uploadPath}\\avatar`);
		const uploadedAvatar = avatarFiles.find((file) => {
			return avatarRegex.test(file);
		});
		expect(uploadedAvatar).toBeDefined();

		const backgroundImageFiles = fs.readdirSync(
			`${uploadPath}\\backgroundImage`,
		);
		const uploadedBackgroundImage = backgroundImageFiles.find((file) => {
			return backgroundImageRegex.test(file);
		});
		expect(uploadedBackgroundImage).toBeDefined();

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("user.username", "createUserTest");
		expect(response.body).toHaveProperty("user.displayName", "createUserTest");
		expect(response.body).toHaveProperty("user.bio", "yes hello");
		expect(response.body).toHaveProperty("user.avatar");
		expect(response.body.user.avatar).toMatch(avatarRegex);
		expect(response.body).toHaveProperty("user.backgroundImage");
		expect(response.body.user.backgroundImage).toMatch(backgroundImageRegex);
		expect(response.body).toHaveProperty("token");
		expect(response.body.token).toMatch(tokenRegex);
		await request(app)
			.delete("/user/self")
			.set("Authorization", `Bearer ${response.body.token}`);
	});

	it("should not register a user with an existing email", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "premadeUser@testing.com")
			.field("password", "Password12345678@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			email: ["Email is being currently used, use a different one"],
		});
	});

	it("should not register a user with invalid email", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest")
			.field("password", "Password12345678@");
		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", { email: ["Invalid email"] });
	});

	it("should not register a user with an existing username", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "premadeUser")
			.field("email", "createUserTest@testing.com")
			.field("password", "Password12345678@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			username: ["Username is being currently used, use a different one"],
		});
	});

	it("should not register a user with an empty username", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "")
			.field("email", "createUserTest@testing.com")
			.field("password", "Password12345678@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			username: ["Username is empty"],
		});
	});

	it("should not register a user with a username that contains non-alphanumeric characters", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "asd@@")
			.field("email", "createUserTest@testing.com")
			.field("password", "Password12345678@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			username: ["Username contains non-alphanumeric characters"],
		});
	});

	it("should not register a user with a password that is less than 10 characters long", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest@testing.com")
			.field("password", "Pa1@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Must be at least 10 characters."],
		});
	});

	it("should not register a user with a password that is missing a digit", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest@testing.com")
			.field("password", "Passworddddd@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Must contain a digit."],
		});
	});

	it("should not register a user with a password that is missing an uppercase letter", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest@testing.com")
			.field("password", "password12345678@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Must contain an uppercase letter."],
		});
	});

	it("should not register a user with a password that is missing a lowercase letter", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest@testing.com")
			.field("password", "PASSWORD12345678@");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Must contain a lower letter."],
		});
	});

	it("should not register a user with a password that is missing a special character", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest@testing.com")
			.field("password", "Password12345678");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Must contain a special character."],
		});
	});

	it("should not register a user with a password that is missing all of the needed parameters", async () => {
		const response = await request(app)
			.post("/user")
			.field("username", "createUserTest")
			.field("email", "createUserTest@testing.com")
			.field("password", "`");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: [
				"Must be at least 10 characters.",
				"Must contain an uppercase letter.",
				"Must contain a lower letter.",
				"Must contain a digit.",
				"Must contain a special character.",
			],
		});
	});

	it("should not register a user due to missing all of the requested fields", async () => {
		const response = await request(app).post("/user");

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			MAIN: ["Missing all required parameters (email, username, password)."],
		});
	});
});
