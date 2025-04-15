import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * Handles the POST request for resetting a user's password.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} - The HTTP response with the result of the password reset operation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body to extract email and newPassword.
    const { email, newPassword } = await request.json();

    // Validate that both email and newPassword are provided.
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Missing email or new password" },
        { status: 400 }, // Bad Request
      );
    }

    // Find the user in the "users" collection by email.
    const user = await mongoDB.findOne("users", { email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }, // Not Found
      );
    }

    // Hash the new password using bcrypt for secure storage.
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the "users" collection.
    const updateSuccess = await mongoDB.updateOne(
      "users",
      { email }, // Query to find the user by email.
      { password: hashedPassword }, // Update the password field.
    );

    // Return success response if the password was updated successfully.
    if (updateSuccess) {
      return NextResponse.json(
        { message: "Password updated successfully" },
        { status: 200 }, // OK
      );
    } else {
      // Return an error response if the update operation failed.
      return NextResponse.json(
        { error: "Unable to update password" },
        { status: 500 }, // Internal Server Error
      );
    }
  } catch (error) {
    // Log the error for debugging purposes.
    logError("Forgot Password Error:", error);

    // Return a generic error response for unexpected server errors.
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }, // Internal Server Error
    );
  }
}
