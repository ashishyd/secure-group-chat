import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { logError } from "@/lib/logger";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { groupId, userId } = await request.json();
    if (!groupId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    // Use $addToSet to add userId to the members array if not already present.
    const result = await db
      .collection("groups")
      .updateOne(
        { _id: new ObjectId(groupId) },
        { $addToSet: { members: userId } },
      );
    if (result.modifiedCount === 1 || result.matchedCount === 1) {
      return NextResponse.json(
        { message: "Joined group successfully" },
        { status: 200 },
      );
    }
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  } catch (error) {
    console.error(error);
    logError("Error joining group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
