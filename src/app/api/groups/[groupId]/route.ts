import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mongoDB } from "@/lib/db";
import { logError } from "@/lib/logger";
import { ObjectId } from "mongodb";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { groupId: string } },
) {
  try {
    const { groupId } = params;
    const result = await mongoDB.deleteOne("groups", {
      _id: new ObjectId(groupId),
    });
    if (result) {
      return NextResponse.json(
        { message: "Group deleted successfully" },
        { status: 200 },
      );
    }
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  } catch (error) {
    logError("Error deleting group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
