import { POST } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("@/lib/db");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("POST /api/auth/login", () => {
  it("returns 200 and sets a token cookie for valid credentials", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      name: "Test User",
      password: "hashedPassword",
    };
    (mongoDB.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("mockToken");

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "password" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: { id: "123", email: "test@example.com", name: "Test User" },
    });
    expect(response.cookies.get("token")?.value).toBe("mockToken");
  });

  it("returns 401 for invalid email", async () => {
    (mongoDB.findOne as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        email: "invalid@example.com",
        password: "password",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid credentials" });
  });

  it("returns 401 for invalid password", async () => {
    const mockUser = {
      _id: "123",
      email: "test@example.com",
      name: "Test User",
      password: "hashedPassword",
    };
    (mongoDB.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongPassword",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid credentials" });
  });

  it("returns 500 for server errors", async () => {
    (mongoDB.findOne as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "password" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Login error" });
  });
});
