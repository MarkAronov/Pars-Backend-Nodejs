import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app";
import { User } from "../../src/models";

describe("User Registration", async () => {
	const userID = new mongoose.Types.ObjectId();
	const testUser = {
		username: "test0",
		email: "test0@testing.com",
		password: await bcrypt.hash("Password123", 8),
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

	it("should register a new user with the bare minimum parameters", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test1@testing.com",
					password: "Password12345678",
				}),
			);

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("user", {
			username: "test1",
			displayName: "test1",
			bio: "",
			avatar: null,
			backgroundImage: null,
		});
		expect(response.body).toHaveProperty("token");
	});

	it("should register a new user with all the parameters", async () => {
		const testImagePath = path.join(__dirname, "../assets");
		const uploadPath = path.join(__dirname, "../../media");

		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test1@testing.com",
					password: "Password12345678",
					displayName: "test1",
					bio: "",
				}),
			)
			.attach("avatar", `${testImagePath}/1.png`)
			.attach("backgroundImage", `${testImagePath}/2.png`);
					
		const files = fs.readdirSync(`${uploadPath}/avatars`);
		const uploadedAvatar = files.find((file) => {
			const regex = /^avatar-\d{13}-\d{9}\.jpg$/;
			return regex.test(file);
		});

		expect(uploadedAvatar).toBeDefined();

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("user", {
			username: "test1",
			displayName: "test1",
			bio: "",
			avatar: null,
			backgroundImage: null,
		});
		expect(response.body).toHaveProperty("token");
	});

	it("should not register a user with an existing email", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test0@testing.com",
					password: "Password12345678",
				}),
			);
		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			email: ["Email is being currently used, use a different one"],
		});
	});

	it("should not register a user with invalid email", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test1",
					password: "Password12345678",
				}),
			);
		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", { email: ["Invalid email"] });
	});

	it("should not register a user with an existing username", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test0",
					email: "test1@testing.com",
					password: "Password12345678",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			username: ["Username is being currently used, use a different one"],
		});
	});

	it("should not register a user with an empty username", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "",
					email: "test1@testing.com",
					password: "Password12345678",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			username: ["Username is empty"],
		});
	});

	it("should not register a user with a username that contains non-alphanumeric characters", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "asd@@",
					email: "test1@testing.com",
					password: "Password12345678",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			username: ["Username contains non-alphanumeric characters"],
		});
	});

	it("should not register a user with a password that is less than 10 characters long", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test1@testing.com",
					password: "Pa1",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Password is less than 10 characters"],
		});
	});

	it("should not register a user with a password that is missing a digit", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test1@testing.com",
					password: "Passworddddd",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Password must have at least one digit"],
		});
	});

	it("should not register a user with a password that is missing an uppercase letter", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test1@testing.com",
					password: "password12345678",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Password must have at least one uppercase letter"],
		});
	});

	it("should not register a user with a password that is missing a lowercase letter", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test1@testing.com",
					password: "PASSWORD12345678",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: ["Password must have at least one lowercase letter"],
		});
	});

	it("should not register a user with a password that is missing all of the needed parameters", async () => {
		const response = await request(app)
			.post("/user")
			.field(
				"content",
				JSON.stringify({
					username: "test1",
					email: "test1@testing.com",
					password: "@",
				}),
			);

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			password: [
				"Password is less than 10 characters",
				"Password must have at least one lowercase letter",
				"Password must have at least one uppercase letter",
				"Password must have at least one digit",
			],
		});
	});

	it("should not register a user due to missing all of the requested fields", async () => {
		const response = await request(app)
			.post("/user")
			.field("content", JSON.stringify({}));

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("ERROR", {
			MAIN: ["Missing all required parameters (email, username, password)."],
		});
	});

	it("should log in a user", async () => {
		const response = await request(app)
			.post("/user/login")
			.field(
				"content",
				JSON.stringify({
					email: "test0@testing.com",
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
					email: "test@testing.com",
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
					email: "test0@testing.com",
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

//   test('Should get own user profile', async () => {
//     const token = testUser.tokens?.[0]?.token;
//     if (!token) throw new Error('Token is undefined');
//     const response = await request(app)
//       .get('/user/self')
//       .set('Authorization', `Bearer ${token}`)
//       .send()
//       .expect(200);

//     expect(response.body).toMatchObject({
//       user: {
//         username: 'test0',
//         email: 'test0@testing.com'
//       }
//     });
//   });

//   test('Should not get own user profile without authorization', async () => {
//     await request(app).get('/user/self').send().expect(401);
//   });

//   test('Should not get own user profile with invalid token', async () => {
//     await request(app)
//       .get('/user/self')
//       .set('Authorization', 'Bearer invalidtoken')
//       .send()
//       .expect(401);
//   });

//   test('Should delete own user profile', async () => {
//     const token = testUser.tokens?.[0]?.token;
//     if (!token) throw new Error('Token is undefined');
//     await request(app)
//       .delete('/user/self')
//       .set('Authorization', `Bearer ${token}`)
//       .send()
//       .expect(200);
//   });

//   test('Should not delete own user profile without authorization', async () => {
//     await request(app).delete('/user/self').send().expect(401);
//   });

//   test('Should not delete own user profile with invalid token', async () => {
//     await request(app)
//       .delete('/user/self')
//       .set('Authorization', 'Bearer invalidtoken')
//       .send()
//       .expect(401);
//   });

//   test('Should update user password', async () => {
//     const token = testUser.tokens?.[0]?.token;
//     if (!token) throw new Error('Token is undefined');
//     await request(app)
//       .patch('/user/self/password')
//       .set('Authorization', `Bearer ${token}`)
//       .send({
//         currentPassword: 'Password123',
//         newPassword: 'NewPassword123'
//       })
//       .expect(200);
//   });

//   test('Should not update user password due to wrong current password', async () => {
//     const token = testUser.tokens?.[0]?.token;
//     if (!token) throw new Error('Token is undefined');
//     const response = await request(app)
//       .patch('/user/self/password')
//       .set('Authorization', `Bearer ${token}`)
//       .send({
//         currentPassword: 'WrongPassword123',
//         newPassword: 'NewPassword123'
//       })
//       .expect(400);

//     expect(response.body).toMatchObject({
//       error: 'Current password is incorrect'
//     });
//   });

//   test('Should not update user password due to missing fields', async () => {
//     const token = testUser.tokens?.[0]?.token;
//     if (!token) throw new Error('Token is undefined');
//     const response = await request(app)
//       .patch('/user/self/password')
//       .set('Authorization', `Bearer ${token}`)
//       .send({
//         newPassword: 'NewPassword123'
//       })
//       .expect(400);

//     expect(response.body).toMatchObject({
//       error: 'Missing required fields'
//     });
//   });

//   test('Should update user details', async () => {
//     const token = testUser.tokens?.[0]?.token;
//     if (!token) throw new Error('Token is undefined');
//     await request(app)
//       .patch('/user/self/regular')
//       .set('Authorization', `Bearer ${token}`)
//       .send({
//         displayName: 'NewDisplayName',
//         bio: 'New bio'
//       })
//       .expect(200);
//   });

//   test('Should not update user details without authorization', async () => {
//     await request(app)
//       .patch('/user/self/regular')
//       .send({
//         displayName: 'NewDisplayName',
//         bio: 'New bio'
//       })
//       .expect(401);
//   });

//   test('Should not update user details with invalid token', async () => {
//     await request(app)
//       .patch('/user/self/regular')
//       .set('Authorization', 'Bearer invalidtoken')
//       .send({
//         displayName: 'NewDisplayName',
//         bio: 'New bio'
//       })
//       .expect(401);
//   });

//   test('Should partially delete user fields', async () => {
//     const token = testUser.tokens?.[0]?.token;
//     if (!token) throw new Error('Token is undefined');
//     await request(app)
//       .delete('/user/self/partial')
//       .set('Authorization', `Bearer ${token}`)
//       .send({
//         requestedFields: ['bio', 'avatar']
//       })
//       .expect(200);
//   });

//   test('Should not partially delete user fields without authorization', async () => {
//     await request(app)
//       .delete('/user/self/partial')
//       .send({
//         requestedFields: ['bio', 'avatar']
//       })
//       .expect(401);
//   });

//   test('Should not partially delete user fields with invalid token', async () => {
//     await request(app)
//       .delete('/user/self/partial')
//       .set('Authorization', 'Bearer invalidtoken')
//       .send({
//         requestedFields: ['bio', 'avatar']
//       })
//       .expect(401);
//   });
