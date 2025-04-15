import { GET, POST } from "@/app/api/messages/route";
import { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

jest.mock("@/lib/db");
jest.mock("@/lib/logger");

describe("GET /api/messages", () => {
  it("returns 400 if groupId is missing", async () => {
    const req = {
      nextUrl: { searchParams: new URLSearchParams() },
    } as unknown as NextRequest;

    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing groupId" });
  });

  it("returns 200 with messages and user names", async () => {
    const req = {
      nextUrl: { searchParams: new URLSearchParams({ groupId: "group1" }) },
    } as unknown as NextRequest;

    (mongoDB.find as jest.Mock).mockImplementation((collection, query) => {
      if (collection === "messages") {
        return [
          {
            _id: "1",
            userId: "user1",
            message: "Hello",
            createdAt: "2023-01-01T00:00:00Z",
            readBy: [],
          },
        ];
      }
      if (collection === "users") {
        return [{ id: "user1", name: "John Doe" }];
      }
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      messages: [
        {
          id: "1",
          userId: "user1",
          message: "Hello",
          createdAt: "2023-01-01T00:00:00.000Z",
          readBy: [],
          userName: "John Doe",
        },
      ],
    });
  });

  it("returns 500 if an error occurs", async () => {
    const req = {
      nextUrl: { searchParams: new URLSearchParams({ groupId: "group1" }) },
    } as unknown as NextRequest;

    (mongoDB.find as jest.Mock).mockRejectedValue(new Error("Database error"));

    const res = await GET(req);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to fetch messages" });
    expect(logError).toHaveBeenCalledWith(
      "GET /api/messages error",
      expect.any(Error),
    );
  });
});

describe("POST /api/messages", () => {
  it("returns 400 if required fields are missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ groupId: "group1", userId: "user1" }),
    } as unknown as NextRequest;

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing required fields" });
  });

  it("returns 201 with the created message", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        groupId: "group1",
        userId: "user1",
        message: "Hello",
        imageUrl: "http://example.com/image.png",
      }),
    } as unknown as NextRequest;

    const insertedMessage = {
      _id: "1",
      groupId: "group1",
      userId: "user1",
      message: "Hello",
      imageUrl: "http://example.com/image.png",
      createdAt: "2023-01-01T00:00:00Z",
    };

    (mongoDB.insertOne as jest.Mock).mockResolvedValue(insertedMessage);

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ message: insertedMessage });
  });

  it("returns 500 if an error occurs", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        groupId: "group1",
        userId: "user1",
        message: "Hello",
        imageUrl: "http://example.com/image.png",
      }),
    } as unknown as NextRequest;

    (mongoDB.insertOne as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal Server Error" });
    expect(logError).toHaveBeenCalledWith(
      "Error creating message:",
      expect.any(Error),
    );
  });
});
