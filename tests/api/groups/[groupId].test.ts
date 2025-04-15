import { DELETE } from "@/app/api/groups/%5BgroupId%5D/route";
import { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";
import { ObjectId } from "mongodb";

jest.mock("@/lib/db");
jest.mock("@/lib/logger");

describe("DELETE /api/groups/[groupId]", () => {
  it("returns 200 when the group is successfully deleted", async () => {
    const mockDeleteOne = jest.fn().mockResolvedValue(true);
    (mongoDB.deleteOne as jest.Mock) = mockDeleteOne;

    const response = await DELETE(new NextRequest("http://localhost"), {
      params: { groupId: "64b7f9f4f4d3a2b1c2d3e4f5" },
    });

    expect(mockDeleteOne).toHaveBeenCalledWith("groups", {
      _id: new ObjectId("64b7f9f4f4d3a2b1c2d3e4f5"),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Group deleted successfully",
    });
  });

  it("returns 404 when the group is not found", async () => {
    const mockDeleteOne = jest.fn().mockResolvedValue(false);
    (mongoDB.deleteOne as jest.Mock) = mockDeleteOne;

    const response = await DELETE(new NextRequest("http://localhost"), {
      params: { groupId: "64b7f9f4f4d3a2b1c2d3e4f5" },
    });

    expect(mockDeleteOne).toHaveBeenCalledWith("groups", {
      _id: new ObjectId("64b7f9f4f4d3a2b1c2d3e4f5"),
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Group not found" });
  });

  it("returns 500 when an error occurs during deletion", async () => {
    const mockDeleteOne = jest
      .fn()
      .mockRejectedValue(new Error("Database error"));
    (mongoDB.deleteOne as jest.Mock) = mockDeleteOne;

    const response = await DELETE(new NextRequest("http://localhost"), {
      params: { groupId: "64b7f9f4f4d3a2b1c2d3e4f5" },
    });

    expect(mockDeleteOne).toHaveBeenCalledWith("groups", {
      _id: new ObjectId("64b7f9f4f4d3a2b1c2d3e4f5"),
    });
    expect(logError).toHaveBeenCalledWith(
      "Error deleting group:",
      expect.any(Error),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });

  it("returns 500 when the groupId is invalid", async () => {
    const response = await DELETE(new NextRequest("http://localhost"), {
      params: { groupId: "invalid-id" },
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
