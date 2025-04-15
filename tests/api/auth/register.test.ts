import { POST } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import bcrypt from "bcrypt";

jest.mock("@/lib/db");
jest.mock("bcrypt");

describe("POST /api/auth/register", () => {
  it("returns 400 if required fields are missing", async () => {
    const request = {
      json: jest.fn().mockResolvedValue({ email: "test@example.com" }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing required fields" });
  });

  it("returns 400 if user already exists", async () => {
    (mongoDB.findOne as jest.Mock).mockResolvedValue({
      email: "test@example.com",
    });

    const request = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "User already exists" });
  });

  it("returns 201 and creates a new user if data is valid", async () => {
    (mongoDB.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword123");
    (mongoDB.insertOne as jest.Mock).mockResolvedValue({
      name: "Test User",
      email: "test@example.com",
      password: "hashedPassword123",
    });

    const request = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      user: {
        name: "Test User",
        email: "test@example.com",
      },
    });
  });

  it("returns 500 if an unexpected error occurs", async () => {
    (mongoDB.findOne as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const request = {
      json: jest.fn().mockResolvedValue({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
