import { GET } from "@/app/api/auth/me/route";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

jest.mock("jsonwebtoken");
jest.mock("@/lib/db");
jest.mock("@/lib/logger");

describe("GET /api/auth/me", () => {
  it("returns 401 if no token is provided", async () => {
    const request = {
      cookies: {
        get: jest.fn().mockReturnValue(undefined),
      },
    } as unknown as NextRequest;

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
  });

  it("returns 401 if token verification fails", async () => {
    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "invalid-token" }),
      },
    } as unknown as NextRequest;

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid or expired token",
    });
    expect(logError).toHaveBeenCalledWith(
      "/api/auth/me error",
      expect.any(Error),
    );
  });

  it("returns 404 if user is not found in the database", async () => {
    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "valid-token" }),
      },
    } as unknown as NextRequest;

    (jwt.verify as jest.Mock).mockReturnValue({ email: "user@example.com" });
    (mongoDB.findOne as jest.Mock).mockResolvedValue(null);

    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
  });

  it("returns 200 with user data if token is valid and user exists", async () => {
    const request = {
      cookies: {
        get: jest.fn().mockReturnValue({ value: "valid-token" }),
      },
    } as unknown as NextRequest;

    const mockUser = {
      _id: "123",
      name: "John Doe",
      email: "user@example.com",
    };

    (jwt.verify as jest.Mock).mockReturnValue({ email: "user@example.com" });
    (mongoDB.findOne as jest.Mock).mockResolvedValue(mockUser);

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        id: "123",
        name: "John Doe",
        email: "user@example.com",
      },
    });
  });
});
