import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Missing email or new password" },
        { status: 400 },
      );
    }

    // Find the user in the "users" collection.
    const user = await mongoDB.findOne("users", { email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash the new password with bcrypt.
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the "users" collection.
    const updateSuccess = await mongoDB.updateOne(
      "users",
      { email },
      { password: hashedPassword },
    );
    if (updateSuccess) {
      return NextResponse.json(
        { message: "Password updated successfully" },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { error: "Unable to update password" },
        { status: 500 },
      );
    }
  } catch (error) {
    logError("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
