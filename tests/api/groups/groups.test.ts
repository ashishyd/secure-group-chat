import { GET, POST } from "@/app/api/groups/route";
import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

jest.mock("@/lib/db");
jest.mock("@/lib/logger");

describe("GET /api/groups", () => {
  it("returns a list of groups when the database query is successful", async () => {
    const mockGroups = [
      { _id: "1", name: "Group 1", creatorId: "user1", members: ["user1"] },
      {
        _id: "2",
        name: "Group 2",
        creatorId: "user2",
        members: ["user2", "user3"],
      },
    ];
    (mongoDB.find as jest.Mock).mockResolvedValue(mockGroups);

    const response = await GET({} as NextRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.groups).toEqual([
      { id: "1", name: "Group 1", creatorId: "user1", members: ["user1"] },
      {
        id: "2",
        name: "Group 2",
        creatorId: "user2",
        members: ["user2", "user3"],
      },
    ]);
  });

  it("returns a 500 error when the database query fails", async () => {
    (mongoDB.find as jest.Mock).mockRejectedValue(new Error("Database error"));

    const response = await GET({} as NextRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Internal Server Error");
    expect(logError).toHaveBeenCalledWith(
      "Error fetching groups:",
      expect.any(Error),
    );
  });
});

describe("POST /api/groups", () => {
  it("creates a new group when valid data is provided", async () => {
    const mockRequest = {
      json: jest
        .fn()
        .mockResolvedValue({ name: "New Group", creatorId: "user1" }),
    } as unknown as NextRequest;
    const mockGroup = {
      _id: "1",
      name: "New Group",
      creatorId: "user1",
      members: ["user1"],
    };
    (mongoDB.insertOne as jest.Mock).mockResolvedValue(mockGroup);

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.group).toEqual(mockGroup);
  });

  it("returns a 400 error when required fields are missing", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ name: "" }),
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Missing required fields");
  });

  it("returns a 500 error when the database insertion fails", async () => {
    const mockRequest = {
      json: jest
        .fn()
        .mockResolvedValue({ name: "New Group", creatorId: "user1" }),
    } as unknown as NextRequest;
    (mongoDB.insertOne as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Internal Server Error");
    expect(logError).toHaveBeenCalledWith(
      "Error creating group:",
      expect.any(Error),
    );
  });
});
