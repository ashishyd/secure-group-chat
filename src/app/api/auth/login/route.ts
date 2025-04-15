import { NextRequest, NextResponse } from "next/server";
import { mongoDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Find the user by email.
    const user = await mongoDB.findOne("users", { email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Compare the password.
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Prepare token payload.
    const tokenPayload = { id: user._id, email: user.email, name: user.name };

    // Sign token with secret from environment.
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    // Create a response and set token in an HTTP-only cookie.
    const response = NextResponse.json({ user: tokenPayload });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error) {
    logError("Login error:", error);
    return NextResponse.json({ error: "Login error" }, { status: 500 });
  }
}
