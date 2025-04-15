import { POST } from "@/app/api/auth/forgot-password/route";
import { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import bcrypt from "bcrypt";

jest.mock("@/lib/db");
jest.mock("bcrypt");

describe("POST /api/auth/forgot-password", () => {
  it("returns 400 if email or newPassword is missing", async () => {
    const request = {
      json: jest.fn().mockResolvedValue({ email: "user@example.com" }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Missing email or new password",
    });
  });

  it("returns 404 if user is not found", async () => {
    (mongoDB.findOne as jest.Mock).mockResolvedValue(null);

    const request = {
      json: jest
        .fn()
        .mockResolvedValue({
          email: "user@example.com",
          newPassword: "newPassword123",
        }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
  });

  it("returns 200 if password is updated successfully", async () => {
    (mongoDB.findOne as jest.Mock).mockResolvedValue({
      email: "user@example.com",
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
    (mongoDB.updateOne as jest.Mock).mockResolvedValue(true);

    const request = {
      json: jest
        .fn()
        .mockResolvedValue({
          email: "user@example.com",
          newPassword: "newPassword123",
        }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Password updated successfully",
    });
  });

  it("returns 500 if password update fails", async () => {
    (mongoDB.findOne as jest.Mock).mockResolvedValue({
      email: "user@example.com",
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
    (mongoDB.updateOne as jest.Mock).mockResolvedValue(false);

    const request = {
      json: jest
        .fn()
        .mockResolvedValue({
          email: "user@example.com",
          newPassword: "newPassword123",
        }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to update password",
    });
  });

  it("returns 500 if an unexpected error occurs", async () => {
    (mongoDB.findOne as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const request = {
      json: jest
        .fn()
        .mockResolvedValue({
          email: "user@example.com",
          newPassword: "newPassword123",
        }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
