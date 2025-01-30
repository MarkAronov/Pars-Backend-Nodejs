import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach } from "vitest";
import app from "../../../src/app";
import { User } from "../../../src/api/user/user.model";

describe("Get Self User", async () => {
    const userID = new mongoose.Types.ObjectId();
    const testUser = {
        username: "getSelfTest",
        email: "getSelfTest@testing.com",
        password: "Password123@",
        displayName: "Test User",
        bio: "Test bio",
        _id: userID,
        sessions: [{
            token: jwt.sign(
                { id: userID },
                process.env.JWT_STRING || "default_jwt_secret",
                { expiresIn: "14d" }
            ),
        }],
    };

    beforeEach(async () => {
        await User.deleteMany();
        await new User(testUser).save();
    });

    it("should get authenticated user's information", async () => {
        const response = await request(app)
            .get("/user/self")
            .set("Authorization", `Bearer ${testUser.sessions[0].token}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("username", testUser.username);
        expect(response.body).toHaveProperty("email", testUser.email.toLowerCase());  // Add toLowerCase()
        expect(response.body).toHaveProperty("displayName", testUser.displayName);
        expect(response.body).toHaveProperty("bio", testUser.bio);
    });

    it("should fail without authorization", async () => {
        const response = await request(app)
            .get("/user/self");
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("ERROR");
    });

    it("should fail with invalid token", async () => {
        const response = await request(app)
            .get("/user/self")
            .set("Authorization", "Bearer invalid_token");
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("ERROR");
    });

    it("should fail with expired token", async () => {
        const expiredToken = jwt.sign(
            { id: userID },
            process.env.JWT_STRING || "default_jwt_secret",
            { expiresIn: '0s' }
        );

        const response = await request(app)
            .get("/user/self")
            .set("Authorization", `Bearer ${expiredToken}`);
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("ERROR");
    });
});
