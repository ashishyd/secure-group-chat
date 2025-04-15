import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get("groupId");
    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    // Get all messages for the group
    const messages = await mongoDB.find("messages", { groupId });

    // Collect unique userIds
    const userIds = [...new Set(messages.map((msg) => msg.userId))];

    // Fetch user details
    const users = await mongoDB.find("users", { id: { $in: userIds } });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    // Attach userName to each message
    const messagesWithNames = messages.map((msg) => ({
      ...msg,
      userName: userMap[msg.userId] || "Unknown",
    }));

    return NextResponse.json({ messages: messagesWithNames }, { status: 200 });
  } catch (error) {
    logError("GET /api/messages error", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
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
