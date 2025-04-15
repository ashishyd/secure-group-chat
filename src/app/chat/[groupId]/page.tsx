"use client";

import React from "react";
import { useParams } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";

/**
 * ChatPage component renders a group chat interface.
 *
 * This component retrieves the `groupId` from the URL parameters using Next.js's `useParams` hook.
 * If no `groupId` is provided, it displays a message indicating that no group is selected.
 * Otherwise, it renders a chat interface with a header and a `ChatWindow` component.
 *
 * @returns {JSX.Element} The rendered chat page.
 */
export default function ChatPage() {
  // Retrieve URL parameters using Next.js's useParams hook
  const params = useParams();
  // Extract the groupId from the parameters
  const groupId = params?.groupId as string | undefined;

  // If no groupId is provided, display a fallback message
  if (!groupId) {
    return <div>No group selected.</div>;
  }

  // Render the chat page layout
  return (
    <div className="flex flex-col h-screen">
      {/* Header section */}
      <header className="p-4 bg-blue-600 text-white">
        <h1 className="text-xl">Group Chat Room</h1>
      </header>
      {/* Main content section */}
      <main className="flex-1">
        {/* ChatWindow component for displaying the chat interface */}
        <ChatWindow groupId={groupId} />
      </main>
    </div>
  );
}
