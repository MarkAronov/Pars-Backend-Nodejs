import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { request } from '../../setup';
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { User } from "../../../src/api/user/user.model";
import app from "../../../src/app";

const TEST_ASSETS_PATH = path.join(process.cwd(), '/__tests__/assets');
const UPLOAD_PATH = path.join(process.cwd(), '/media');

interface TestUser {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  bio?: string;
}

const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  username: "testuser",
  email: "test@example.com",
  password: "Password123@",
  ...overrides
});

describe('POST /user', () => {
  const userID = new mongoose.Types.ObjectId();
  const existingUser = {
    username: "existinguser",
    email: "existing@example.com",
    password: "Password123@",
    _id: userID,
    sessions: [{
      token: jwt.sign(
        { id: userID },
        process.env.JWT_STRING || "default_jwt_secret",
        { expiresIn: "14d" }
      )
    }]
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await new User(existingUser).save();
  });

  afterEach(async () => {
    // Cleanup uploaded files
    for (const dir of ['avatar', 'backgroundImage']) {
      const dirPath = path.join(UPLOAD_PATH, dir);
      if (fs.existsSync(dirPath)) {
        for (const file of fs.readdirSync(dirPath)) {
          fs.unlinkSync(path.join(dirPath, file));
        }
      }
    }
  });

  describe('Success cases', () => {
    it('should create user with minimal required fields', async () => {
      const userData = createTestUser();
      const response = await request(app)
        .post("/user")
        .field("username", userData.username)
        .field("email", userData.email)
        .field("password", userData.password);

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        username: userData.username,
        displayName: userData.username,
        bio: "",
        avatar: null,
        backgroundImage: null
      });
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    it('should create user with all optional fields and files', async () => {
      const userData = createTestUser({
        displayName: "Test Display",
        bio: "Test bio"
      });

      const response = await request(app)
        .post("/user")
        .field("username", userData.username)
        .field("email", userData.email)
        .field("password", userData.password)
        .field("displayName", userData.displayName)
        .field("bio", userData.bio)
        .attach("avatar", path.join(TEST_ASSETS_PATH, "1.png"))
        .attach("backgroundImage", path.join(TEST_ASSETS_PATH, "2.png"));

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        username: userData.username,
        displayName: userData.displayName,
        bio: userData.bio
      });
      expect(response.body.user.avatar).toMatch(/^avatar-\d{13}-[a-f0-9]{32}\.(png|jpg|gif)/);
      expect(response.body.user.backgroundImage).toMatch(/^backgroundImage-\d{13}-[a-f0-9]{32}\.(png|jpg|gif)/);
    });
  });

  describe('Validation failures', () => {
    it('should reject duplicate email/username', async () => {
      const response = await request(app)
        .post("/user")
        .field("username", existingUser.username)
        .field("email", existingUser.email)
        .field("password", "Password123@");

      expect(response.status).toBe(400);
      expect(response.body.ERROR).toMatchObject({
        username: ["Username is being currently used, use a different one"],
        email: ["Email is being currently used, use a different one"]
      });
    });

    it.each([
      ['empty username', { username: "" }, { username: ["Username is empty"] }],
      ['invalid username', { username: "test@user" }, { username: ["Username contains non-alphanumeric characters"] }],
      ['invalid email', { email: "invalid-email" }, { email: ["Invalid email"] }],
      ['short password', { password: "Short1@" }, { password: ["Must be at least 10 characters."] }]
    ])('should validate %s', async (_, userData, expectedError) => {
      const response = await request(app)
        .post("/user")
        .field("username", userData.username || "validuser")
        .field("email", userData.email || "valid@example.com")
        .field("password", userData.password || "Password123@");

      expect(response.status).toBe(400);
      expect(response.body.ERROR).toMatchObject(expectedError);
    });

    it('should validate password requirements comprehensively', async () => {
      const response = await request(app)
        .post("/user")
        .field("username", "testuser")
        .field("email", "test@example.com")
        .field("password", "weak");

      expect(response.status).toBe(400);
      expect(response.body.ERROR.password).toEqual(expect.arrayContaining([
        "Must be at least 10 characters.",
        "Must contain an uppercase letter.",
        "Must contain a digit.",
        "Must contain a special character."
      ]));
    });
  });
});
