import { POST } from "@/app/api/groups/leave/route";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { logError } from "@/lib/logger";

jest.mock("@/lib/db");
jest.mock("@/lib/logger");

describe("POST /api/groups/leave", () => {
  it("returns 400 if groupId or userId is missing", async () => {
    const request = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Missing required fields: groupId and userId are mandatory.",
    });
  });

  it("returns 400 if groupId format is invalid", async () => {
    const request = {
      json: jest
        .fn()
        .mockResolvedValue({ groupId: "invalid", userId: "user123" }),
    } as unknown as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid groupId format.",
    });
  });

  it("returns 200 if user is successfully removed from the group", async () => {
    const request = {
      json: jest
        .fn()
        .mockResolvedValue({
          groupId: new ObjectId().toString(),
          userId: "user123",
        }),
    } as unknown as NextRequest;

    (connectToDatabase as jest.Mock).mockResolvedValue({
      db: {
        collection: jest.fn().mockReturnValue({
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        }),
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Left group successfully.",
    });
  });

  it("returns 404 if group is not found or user is not a member", async () => {
    const request = {
      json: jest
        .fn()
        .mockResolvedValue({
          groupId: new ObjectId().toString(),
          userId: "user123",
        }),
    } as unknown as NextRequest;

    (connectToDatabase as jest.Mock).mockResolvedValue({
      db: {
        collection: jest.fn().mockReturnValue({
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
        }),
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Group not found or user was not a member.",
    });
  });

  it("returns 500 if an unexpected error occurs", async () => {
    const request = {
      json: jest
        .fn()
        .mockResolvedValue({
          groupId: new ObjectId().toString(),
          userId: "user123",
        }),
    } as unknown as NextRequest;

    (connectToDatabase as jest.Mock).mockRejectedValue(
      new Error("Database connection failed"),
    );

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "An unexpected error occurred. Please try again later.",
    });
    expect(logError).toHaveBeenCalledWith(
      "Error in POST /api/groups/leave:",
      expect.any(Error),
    );
  });
});
