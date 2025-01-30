import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../src/app";
import { User } from "../../../src/api/user/user.model";

describe("User Password Update", async () => {
    const userID = new mongoose.Types.ObjectId();
    const testUser = {
        username: "passwordUpdateTest",
        email: "passwordUpdate@testing.com",
        password: "Password123@",
        _id: userID,
        sessions: [{
            token: jwt.sign(
                { id: userID },
                process.env.JWT_STRING || "default_jwt_secret",
                { expiresIn: "14d" },
            ),
        }],
    };

    beforeEach(async () => {
        await User.deleteMany();
        await new User(testUser).save();
    });

    it("should update password successfully", async () => {
        const newPassword = "NewPassword123@";
        const response = await request(app)
            .patch("/user/password")
            .set("Authorization", `Bearer ${testUser.sessions[0].token}`)
            .field("currentPassword", testUser.password)
            .field("newPassword", newPassword);

        expect(response.status).toBe(200);

        // Verify old password no longer works
        const oldLoginResponse = await request(app)
            .post("/user/login")
            .field("email", testUser.email)
            .field("password", testUser.password);
        expect(oldLoginResponse.status).toBe(400);

        // Verify new password works
        const newLoginResponse = await request(app)
            .post("/user/login")
            .field("email", testUser.email)
            .field("password", newPassword);
        expect(newLoginResponse.status).toBe(200);
    });

    it("should not update with incorrect current password", async () => {
        const response = await request(app)
            .patch("/user/password")
            .set("Authorization", `Bearer ${testUser.sessions[0].token}`)
            .field("currentPassword", "WrongPassword123@")
            .field("newPassword", "NewPassword123@");

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("ERROR");
    });

    it("should validate new password requirements", async () => {
        const response = await request(app)
            .patch("/user/password")
            .set("Authorization", `Bearer ${testUser.sessions[0].token}`)
            .field("currentPassword", testUser.password)
            .field("newPassword", "weak");

        expect(response.status).toBe(400);
        expect(response.body.ERROR).toHaveProperty("password");
    });

    it("should require authentication", async () => {
        const response = await request(app)
            .patch("/user/password")
            .field("currentPassword", testUser.password)
            .field("newPassword", "NewPassword123@");

        expect(response.status).toBe(401);
    });
});
