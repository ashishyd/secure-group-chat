import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { logError } from "@/lib/logger";
import { ObjectId } from "mongodb";

/**
 * Handles the POST request to remove a user from a group.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} - A response indicating the result of the operation.
 *
 * The function performs the following steps:
 * 1. Parses and validates the `groupId` and `userId` from the request body.
 * 2. Ensures `groupId` is a valid MongoDB ObjectId.
 * 3. Connects to the database and attempts to remove the user from the group's members list.
 * 4. Returns a success response if the operation is successful, or an error response otherwise.
 * 5. Logs any errors that occur and returns a generic error response for unexpected issues.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate the request body
    const { groupId, userId } = await request.json();
    if (!groupId || !userId) {
      // Return a 400 response if required fields are missing
      return NextResponse.json(
        { error: "Missing required fields: groupId and userId are mandatory." },
        { status: 400 },
      );
    }

    // Validate groupId format
    if (!ObjectId.isValid(groupId)) {
      // Return a 400 response if groupId is invalid
      return NextResponse.json(
        { error: "Invalid groupId format." },
        { status: 400 },
      );
    }

    // Connect to the database
    const { db } = await connectToDatabase();

    // Attempt to remove the user from the group's members list
    const result = await db
      .collection("groups")
      .updateOne(
        { _id: new ObjectId(groupId) },
        { $pull: { members: userId } },
      );

    if (result.modifiedCount === 1) {
      // Return a 200 response if the user was successfully removed
      return NextResponse.json(
        { message: "Left group successfully." },
        { status: 200 },
      );
    }

    // Return a 404 response if the group was not found or the user was not a member
    return NextResponse.json(
      { error: "Group not found or user was not a member." },
      { status: 404 },
    );
  } catch (error) {
    // Log the error with additional context
    logError("Error in POST /api/groups/leave:", error);

    // Return a generic error response for unexpected issues
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
