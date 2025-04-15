import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Retrieve token from cookies.
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the token.
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      name: string;
    };

    console.log(decoded);

    // Fetch the user from the database.
    const user = await mongoDB.findOne("users", { email: decoded.email });
    console.log(user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // // Ensure user.id is an ObjectId
    // const userId = new ObjectId(user.id).toString();
    //
    // // Fetch groups where the user is a member OR the creator.
    // const groups = await mongoDB.find("groups", {
    //   $or: [{ members: userId }, { creatorId: userId }],
    // });

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
    logError("/api/auth/me error", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }
}
