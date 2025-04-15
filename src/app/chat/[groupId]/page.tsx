"use client";

import React from "react";
import { useParams } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  const params = useParams();
  const groupId = params?.groupId as string | undefined;
  const userId = "user1"; // Replace with actual authenticated user ID

  if (!groupId) {
    return <div>No group selected.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-blue-600 text-white">
        <h1 className="text-xl">Group Chat Room</h1>
      </header>
      <main className="flex-1">
        <ChatWindow groupId={groupId} userId={userId} />
      </main>
    </div>
  );
}
