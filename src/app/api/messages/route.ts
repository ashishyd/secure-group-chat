import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * Handles GET requests to fetch messages for a specific group.
 *
 * @param {NextRequest} req - The incoming request object.
 * @returns {Promise<NextResponse>} - A JSON response containing the messages or an error message.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract the groupId from the query parameters
    const groupId = req.nextUrl.searchParams.get("groupId");
    if (!groupId) {
      // Return a 400 response if groupId is missing
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    // Fetch all messages for the specified group from the database
    const dbMessages = await mongoDB.find("messages", { groupId });

    // Map the database messages to a structured format
    const messages = dbMessages.map((msg) => ({
      id: msg._id,
      userId: msg.userId,
      message: msg.message,
      imageUrl: msg.imageUrl,
      createdAt: new Date(msg.createdAt).toISOString(),
      readBy: msg.readBy,
    }));

    // Collect unique userIds from the messages
    const userIds = [...new Set(messages.map((msg) => msg.userId))];

    // Fetch user details for the collected userIds
    const users = await mongoDB.find("users", { id: { $in: userIds } });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    // Attach userName to each message
    const messagesWithNames = messages.map((msg) => ({
      ...msg,
      userName: userMap[msg.userId] || "Unknown",
    }));

    // Return the messages with user names as a JSON response
    return NextResponse.json({ messages: messagesWithNames }, { status: 200 });
  } catch (error) {
    // Log the error and return a 500 response
    logError("GET /api/messages error", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

/**
 * Handles POST requests to create a new message in a group.
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {Promise<NextResponse>} - A JSON response containing the created message or an error message.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body to extract required fields
    const { groupId, userId, message, imageUrl } = await request.json();
    if (!groupId || !userId || !message) {
      // Return a 400 response if any required field is missing
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create a new message object
    const newMessage = {
      groupId,
      userId,
      message,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    // Insert the new message into the database
    const insertedMsg = await mongoDB.insertOne("messages", newMessage);

    // Return the inserted message as a JSON response
    return NextResponse.json({ message: insertedMsg }, { status: 201 });
  } catch (error) {
    // Log the error and return a 500 response
    logError("Error creating message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
