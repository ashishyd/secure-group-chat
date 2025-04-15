import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";

export async function GET(_request: NextRequest) {
  try {
    // Retrieve all groups from the "groups" collection.
    const groups = await mongoDB.find("groups");
    return NextResponse.json(
      {
        groups: groups.map((group) => ({
          id: group._id,
          name: group.name,
          creatorId: group.creatorId,
          members: group.members,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    logError("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, creatorId } = await request.json();
    if (!name || !creatorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the group document. The creator is added as the first member.
    const newGroup = await mongoDB.insertOne("groups", {
      name,
      creatorId,
      members: [creatorId],
    });
    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error) {
    logError("Error creating group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
