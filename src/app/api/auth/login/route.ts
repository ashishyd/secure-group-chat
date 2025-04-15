import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logError } from "@/lib/logger";

/**
 * Handles the POST request for user login.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} - The HTTP response containing the user data or an error message.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body to extract email and password.
    const { email, password } = await request.json();

    // Find the user in the database by email.
    const user = await mongoDB.findOne("users", { email });
    if (!user) {
      // Return a 401 response if the user is not found.
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Compare the provided password with the stored hashed password.
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Return a 401 response if the password is invalid.
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Prepare the payload for the JWT token.
    const tokenPayload = { id: user._id, email: user.email, name: user.name };

    // Sign the JWT token using the secret from the environment variables.
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "7d", // Token expires in 7 days.
    });

    // Create a response object and set the token in an HTTP-only cookie.
    const response = NextResponse.json({ user: tokenPayload });
    response.cookies.set("token", token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie.
      secure: process.env.NODE_ENV === "production", // Ensures the cookie is sent over HTTPS in production.
      sameSite: "lax", // Restricts the cookie to same-site requests.
      path: "/", // Makes the cookie available to all routes.
      maxAge: 7 * 24 * 60 * 60, // Sets the cookie expiration to 7 days (in seconds).
    });

    // Return the response with the user data and the token cookie.
    return response;
  } catch (error) {
    // Log the error and return a 500 response in case of an exception.
    logError("Login error:", error);
    return NextResponse.json({ error: "Login error" }, { status: 500 });
  }
}
