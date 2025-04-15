import { POST } from "@/app/api/groups/join/route";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { logError } from "@/lib/logger";
import { ObjectId } from "mongodb";

jest.mock("@/lib/db");
jest.mock("@/lib/logger");

describe("POST /api/groups/join", () => {
  it("returns 200 when user is successfully added to the group", async () => {
    const mockRequest = {
      json: jest
        .fn()
        .mockResolvedValue({
          groupId: "64b7f9f4c2a1e8d1a1a1a1a1",
          userId: "user123",
        }),
    } as unknown as NextRequest;

    const mockDb = {
      collection: jest.fn().mockReturnValue({
        updateOne: jest
          .fn()
          .mockResolvedValue({ modifiedCount: 1, matchedCount: 1 }),
      }),
    };
    (connectToDatabase as jest.Mock).mockResolvedValue({ db: mockDb });

    const response = await POST(mockRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Joined group successfully",
    });
  });

  it("returns 400 when groupId or userId is missing", async () => {
    const mockRequest = {
      json: jest
        .fn()
        .mockResolvedValue({ groupId: "64b7f9f4c2a1e8d1a1a1a1a1" }),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing required fields" });
  });

  it("returns 404 when the group is not found", async () => {
    const mockRequest = {
      json: jest
        .fn()
        .mockResolvedValue({
          groupId: "64b7f9f4c2a1e8d1a1a1a1a1",
          userId: "user123",
        }),
    } as unknown as NextRequest;

    const mockDb = {
      collection: jest.fn().mockReturnValue({
        updateOne: jest
          .fn()
          .mockResolvedValue({ modifiedCount: 0, matchedCount: 0 }),
      }),
    };
    (connectToDatabase as jest.Mock).mockResolvedValue({ db: mockDb });

    const response = await POST(mockRequest);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Group not found" });
  });

  it("returns 500 when an internal server error occurs", async () => {
    const mockRequest = {
      json: jest
        .fn()
        .mockResolvedValue({
          groupId: "64b7f9f4c2a1e8d1a1a1a1a1",
          userId: "user123",
        }),
    } as unknown as NextRequest;

    (connectToDatabase as jest.Mock).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const response = await POST(mockRequest);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(logError).toHaveBeenCalledWith(
      "Error joining group:",
      expect.any(Error),
    );
  });
});
