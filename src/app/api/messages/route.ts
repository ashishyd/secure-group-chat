import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }
    // Find messages for the given group
    const messages = await mongoDB.find("messages", { groupId });
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    logError("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { groupId, userId, message, imageUrl } = await request.json();
    if (!groupId || !userId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    const newMessage = {
      groupId,
      userId,
      message,
      imageUrl,
      createdAt: new Date().toISOString(),
    };
    const insertedMsg = await mongoDB.insertOne("messages", newMessage);
    return NextResponse.json({ message: insertedMsg }, { status: 201 });
  } catch (error) {
    logError("Error creating message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
