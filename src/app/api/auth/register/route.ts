import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * Handles the POST request for user registration.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} - The HTTP response containing the newly created user data or an error message.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body to extract email, password, and name.
    const { email, password, name } = await request.json();

    // Validate that all required fields are provided.
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if a user with the provided email already exists in the database.
    const existingUser = await mongoDB.findOne("users", { email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // Hash the user's password using bcrypt with a salt factor of 10.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the "users" collection in the database.
    const newUser = await mongoDB.insertOne("users", {
      name,
      email,
      password: hashedPassword,
    });

    // Exclude the password field from the response object.
    const { password: _, ...userWithoutPassword } = newUser;

    // Return a 201 response with the newly created user data.
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    // Log the error and return a 500 response in case of an exception.
    logError("Registration Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
