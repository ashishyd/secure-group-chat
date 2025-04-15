import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";
import { ObjectId } from "mongodb";

/**
 * Handles the DELETE request to remove a group by its ID.
 *
 * @param {NextRequest} _request - The incoming HTTP request object (not used in this handler).
 * @param {Object} context - The context object containing route parameters.
 * @param {Object} context.params - The route parameters.
 * @param {string} context.params.groupId - The ID of the group to be deleted.
 * @returns {Promise<NextResponse>} - The HTTP response indicating the result of the operation.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const { groupId } = params;

    // Attempt to delete the group from the "groups" collection using its ID.
    const result = await mongoDB.deleteOne("groups", {
      _id: new ObjectId(groupId),
    });

    if (result) {
      // Return a 200 response if the group was successfully deleted.
      return NextResponse.json(
        { message: "Group deleted successfully" },
        { status: 200 },
      );
    }

    // Return a 404 response if the group was not found.
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  } catch (error) {
    // Log the error and return a 500 response in case of an exception.
    logError("Error deleting group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
