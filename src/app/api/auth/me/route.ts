import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * Handles the GET request to retrieve the authenticated user's information.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} - The HTTP response containing the user data or an error message.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Retrieve the token from cookies.
    const token = request.cookies.get("token")?.value;

    if (!token) {
      // Return a 401 response if the token is not present.
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the token using the secret from the environment variables.
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      name: string;
    };

    console.log(decoded);

    // Fetch the user from the database using the email from the decoded token.
    const user = await mongoDB.findOne("users", { email: decoded.email });
    console.log(user);
    if (!user) {
      // Return a 404 response if the user is not found.
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // // Ensure user.id is an ObjectId
    // const userId = new ObjectId(user.id).toString();
    //
    // // Fetch groups where the user is a member OR the creator.
    // const groups = await mongoDB.find("groups", {
    //   $or: [{ members: userId }, { creatorId: userId }],
    // });

    // Return the user data in the response.
    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    // Log the error and return a 401 response if an exception occurs.
    logError("/api/auth/me error", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }
}
