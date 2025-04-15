import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * Handles GET requests to retrieve all groups from the database.
 *
 * @param {NextRequest} _request - The incoming HTTP request object (not used in this handler).
 * @returns {Promise<NextResponse>} A JSON response containing the list of groups or an error message.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Retrieve all groups from the "groups" collection.
    const groups = await mongoDB.find("groups");
    return NextResponse.json(
      {
        groups: groups.map((group) => ({
          id: group._id, // The unique identifier of the group.
          name: group.name, // The name of the group.
          creatorId: group.creatorId, // The ID of the user who created the group.
          members: group.members, // The list of members in the group.
        })),
      },
      { status: 200 }, // HTTP status code for success.
    );
  } catch (error) {
    // Log the error and return a 500 Internal Server Error response.
    logError("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Handles POST requests to create a new group in the database.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the group data.
 * @returns {Promise<NextResponse>} A JSON response containing the created group or an error message.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body to extract the group name and creator ID.
    const { name, creatorId } = await request.json();
    if (!name || !creatorId) {
      // Return a 400 Bad Request response if required fields are missing.
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the group document. The creator is added as the first member.
    const newGroup = await mongoDB.insertOne("groups", {
      name, // The name of the group.
      creatorId, // The ID of the user who created the group.
      members: [creatorId], // Initialize the members list with the creator.
    });
    return NextResponse.json({ group: newGroup }, { status: 201 }); // HTTP status code for resource creation.
  } catch (error) {
    // Log the error and return a 500 Internal Server Error response.
    logError("Error creating group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
