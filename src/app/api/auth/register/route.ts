import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if the user already exists.
    const existingUser = await mongoDB.findOne("users", { email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // Hash password.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the "users" collection.
    const newUser = await mongoDB.insertOne("users", {
      name,
      email,
      password: hashedPassword,
    });

    // Remove password field before returning to client.
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    logError("Registration Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
