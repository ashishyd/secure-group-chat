"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { decryptMessage, encryptMessage } from "@/lib/encrypt";
import { Message } from "@/types";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useBroadcast } from "@/hooks/useBroadcast";
import { debounce } from "lodash";

const UnfilledTickIcon = () => (
  <svg
    className="w-4 h-4 text-gray-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 13l4 4L19 7"
    ></path>
  </svg>
);

const FilledTickIcon = () => (
  <svg
    className="w-4 h-4 text-green-500"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8.25 8.25a1 1 0 01-1.414 0l-4.25-4.25a1 1 0 111.414-1.414L7 12.086l7.543-7.543a1 1 0 011.414 0z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const SmartReplyTag = ({
  reply,
  onClick,
}: {
  reply: string;
  onClick: (reply: string) => void;
}) => (
  <Button
    onClick={() => onClick(reply)}
    className="inline-flex items-center bg-blue-100 text-blue-800 text-sm font-medium mr-2 mb-2 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <span className="mr-1 text-lg">🤖</span>
    <span>{reply}</span>
  </Button>
);

interface ChatWindowProps {
  groupId: string;
}

const ChatWindow = ({ groupId }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const socket = useSocket();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userIdToName, setUserIdToName] = useState<Record<string, string>>({});

  if (!user) return <div>Loading user...</div>;

  // Fetch messages on mount (and when groupId changes)
  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await fetch(`/api/messages?groupId=${groupId}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.messages)) {
            const decryptedMessages = data.messages.map((msg: Message) => ({
              ...msg,
              message: decryptMessage(msg.message),
            }));
            setMessages(decryptedMessages);
            // Build a userId -> userName map from messages if provided
            const map: Record<string, string> = { ...userIdToName };
            decryptedMessages.forEach((msg: Message) => {
              if (msg.userName) {
                map[msg.userId] = msg.userName;
              }
            });
            setUserIdToName(map);
          }
        } else {
          console.error("Failed to fetch messages:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }
    fetchMessages();
  }, [groupId]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("joinGroup", groupId);

    socket.on("newMessage", (data: Message) => {
      const decryptedMsg = decryptMessage(data.message);
      const incomingMessage: Message = {
        ...data,
        message: decryptedMsg,
        readBy: data.readBy || [],
      };
      // Update state: if current user sent the message and an optimistic message exists, replace it.
      setMessages((prev) => {
        // Look for an optimistic message from this user with matching content.
        const optimisticIndex = prev.findIndex(
          (msg) =>
            msg.userId === user.id &&
            msg.message === incomingMessage.message &&
            msg.id.startsWith("temp_"),
        );
        if (optimisticIndex !== -1) {
          const newMessages = [...prev];
          newMessages[optimisticIndex] = incomingMessage;
          return newMessages;
        }
        // Avoid adding duplicate messages by checking for matching _id.
        if (prev.some((msg) => msg.id === incomingMessage.id)) return prev;
        return [...prev, incomingMessage];
      });

      // If message is from someone else, fetch smart replies to suggest responses.
      if (data.userId !== user.id) {
        fetchSmartReplies(decryptedMsg);
      }
      // Emit read receipt.
      socket.emit("readReceipt", {
        groupId,
        messageId: data.id,
        userId: user.id,
      });
    });

    socket.on(
      "readReceipt",
      (data: { messageId: string; userId: string; groupId: string }) => {
        if (data.groupId !== groupId) return;
        setMessages((prev) =>
          prev.map((msg) => {
            if (
              msg.id === data.messageId &&
              !msg.readBy?.includes(data.userId)
            ) {
              return { ...msg, readBy: [...(msg.readBy || []), data.userId] };
            }
            return msg;
          }),
        );
      },
    );

    socket.on(
      "typing",
      (data: { userId: string; groupId: string; userName?: string }) => {
        if (data.groupId !== groupId || data.userId === user.id) return;
        // Update user map as well
        setUserIdToName((prev) => ({
          ...prev,
          [data.userId]: data.userName || data.userId,
        }));
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) return [...prev, data.userId];
          return prev;
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }, 3000);
      },
    );

    socket.on("stopTyping", (data: { userId: string; groupId: string }) => {
      if (data.groupId !== groupId) return;
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    return () => {
      socket.off("newMessage");
      socket.off("readReceipt");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, groupId, user.id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const broadcastTyping = useBroadcast("chat-activity", (data) => {
    if (data.groupId !== groupId || data.userId === user.id) return;

    if (data.type === "TYPING") {
      setUserIdToName((prev) => ({
        ...prev,
        [data.userId]: data.userName || prev[data.userId] || data.userId,
      }));
      setTypingUsers((prev) =>
        prev.includes(data.userId) ? prev : [...prev, data.userId],
      );

      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }, 3000);
    }

    if (data.type === "STOP_TYPING") {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    }
  });

  const emitTyping = () => {
    const payload = { groupId, userId: user.id, userName: user.name };
    socket?.emit("typing", payload);
    // broadcastTyping(payload);
  };

  // Debounced typing event (runs max once per 300ms)
  const handleTyping = debounce(emitTyping, 300);

  const fetchSmartReplies = async (messageText: string) => {
    try {
      const res = await fetch("/api/smart-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.suggestions)) {
          setSmartReplies(data.suggestions);
        }
      } else {
        console.error("Failed to fetch smart replies");
      }
    } catch (error) {
      console.error("Error fetching smart replies", error);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      console.error("Selected file is not an image");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const imageUrl = data.url;
        if (imageUrl) {
          const tempId = "temp_" + Date.now().toString();
          const optimisticMessage: Message = {
            id: tempId,
            groupId: groupId,
            userId: user.id,
            message: "",
            imageUrl: imageUrl,
            createdAt: new Date().toISOString(),
            readBy: [user.id],
          };
          setMessages((prev) => [...prev, optimisticMessage]);
          socket?.emit("sendMessage", {
            groupId,
            userId: user.id,
            message: encryptMessage(""),
            imageUrl,
          });
          const saveRes = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              userId: user.id,
              message: encryptMessage(""),
              imageUrl,
            }),
          });
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            const savedMessage: Message = saveData.message;
            const finalMessage: Message = {
              ...savedMessage,
              imageUrl,
              message: "",
            };
            setMessages((prev) =>
              prev.map((msg) => (msg.id === tempId ? finalMessage : msg)),
            );
          }
        }
      } else {
        console.error("Image upload failed", await res.text());
      }
    } catch (error) {
      console.error("Error during image upload", error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const sendMessage = async () => {
    if (messageInput.trim() === "" || !socket) return;
    broadcastTyping({ type: "STOP_TYPING", userId: user.id, groupId });

    const encryptedMsg = encryptMessage(messageInput);

    const tempId = "temp_" + Date.now().toString();
    const optimisticMessage: Message = {
      id: tempId,
      groupId,
      userId: user.id,
      message: messageInput,
      createdAt: new Date().toISOString(),
      readBy: [user.id],
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput("");

    socket?.emit("sendMessage", {
      groupId,
      userId: user.id,
      message: encryptedMsg,
    });

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          userId: user.id,
          message: encryptedMsg,
          imageUrl: "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const savedMessage: Message = data.message;
        const decryptedSavedMessage: Message = {
          ...savedMessage,
          message: decryptMessage(savedMessage.message),
        };
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? decryptedSavedMessage : msg)),
        );
        // Do not fetch smart replies for self-sent messages.
      } else {
        console.error("Failed to save message", await res.text());
      }
    } catch (error) {
      console.error("Error saving message", error);
    }
  };

  const handleSmartReplyClick = (reply: string) => {
    setMessageInput(reply);
    setSmartReplies([]);
  };

  // Render each message with alignment.
  const renderMessage = (msg: Message, index: number) => {
    const isSender = msg.userId === user.id;
    return (
      <div
        key={index}
        className={`mb-2 flex ${isSender ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`p-2 rounded max-w-xs break-words ${isSender ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
        >
          <div className="text-xs mb-1">
            {isSender ? user.name : msg.userName || msg.userName}
          </div>
          <div>{msg.message}</div>
          {msg.imageUrl && (
            <Image
              src={msg.imageUrl}
              alt="attached"
              className="mt-1 max-w-xs rounded"
              width={200} // Adjust width as needed
              height={200} // Adjust height as needed
            />
          )}
          {isSender && (
            <div className="mt-1 flex justify-end">
              {msg.readBy && msg.readBy.length > 1 ? (
                <FilledTickIcon />
              ) : (
                <UnfilledTickIcon />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => renderMessage(msg, index))}
        <div ref={messageEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          {typingUsers.map((id, i) => (
            <span key={id}>
              {i > 0 && ", "}
              {userIdToName[id] ?? id}
            </span>
          ))}{" "}
          {typingUsers.length === 1 ? "is typing..." : "are typing..."}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      {smartReplies.length > 0 && (
        <div className="px-4 py-2">
          <div className="mb-2 text-sm text-gray-600">Quick Replies:</div>
          <div className="flex flex-wrap">
            {smartReplies.map((reply, index) => (
              <SmartReplyTag
                key={index}
                reply={reply}
                onClick={handleSmartReplyClick}
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-white-100 border-t border-gray-100">
        <TextInput
          label=""
          name="chat"
          type="text"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={() => handleTyping()}
          onBlur={() =>
            socket?.emit("stopTyping", { groupId, userId: user.id })
          }
        />
        <div className="flex p-2">
          <div className="w-1/2"></div>
          <div className="w-1/2 flex justify-end">
            <Button
              onClick={triggerFileInput}
              className="mr-2"
              title="Attach Image"
            >
              📎
            </Button>
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
