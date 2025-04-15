import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { logError } from "@/lib/logger";
import { ObjectId } from "mongodb";

/**
 * Handles the POST request to join a group by adding a user to the group's members list.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} - The HTTP response indicating the result of the operation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body to extract groupId and userId.
    const { groupId, userId } = await request.json();

    // Validate that both groupId and userId are provided.
    if (!groupId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Connect to the database.
    const { db } = await connectToDatabase();

    // Use $addToSet to add userId to the members array if not already present.
    const result = await db
      .collection("groups")
      .updateOne(
        { _id: new ObjectId(groupId) },
        { $addToSet: { members: userId } },
      );

    // Check if the group was found and updated.
    if (result.modifiedCount === 1 || result.matchedCount === 1) {
      return NextResponse.json(
        { message: "Joined group successfully" },
        { status: 200 },
      );
    }

    // Return a 404 response if the group was not found.
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  } catch (error) {
    // Log the error and return a 500 response in case of an exception.
    console.error(error);
    logError("Error joining group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
