"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { decryptMessage, encryptMessage } from "@/lib/encrypt";
import { Message } from "@/types";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

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

  if (!user) return <div>Loading user...</div>;

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
      setMessages((prev) => [...prev, incomingMessage]);
      socket.emit("readReceipt", {
        groupId,
        messageId: data._id,
        userId: user._id,
      });
    });

    socket.on(
      "readReceipt",
      (data: { messageId: string; userId: string; groupId: string }) => {
        if (data.groupId !== groupId) return;
        setMessages((prev) =>
          prev.map((msg) => {
            if (
              msg._id === data.messageId &&
              !msg.readBy?.includes(data.userId)
            ) {
              return { ...msg, readBy: [...(msg.readBy || []), data.userId] };
            }
            return msg;
          }),
        );
      },
    );

    socket.on("typing", (data: { userId: string; groupId: string }) => {
      if (data.groupId === groupId && data.userId !== user._id) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) return [...prev, data.userId];
          return prev;
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }, 3000);
      }
    });

    return () => {
      socket.off("newMessage");
      socket.off("readReceipt");
      socket.off("typing");
    };
  }, [socket, groupId, user._id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    socket?.emit("typing", { groupId, userId: user._id });
  };

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
            _id: tempId,
            groupId: groupId,
            userId: user._id,
            message: "",
            imageUrl: imageUrl,
            createdAt: new Date().toISOString(),
            readBy: [user._id],
          };
          setMessages((prev) => [...prev, optimisticMessage]);
          socket?.emit("sendMessage", {
            groupId,
            userId: user._id,
            message: encryptMessage(""),
            imageUrl,
          });
          const saveRes = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              userId: user._id,
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
              prev.map((msg) => (msg._id === tempId ? finalMessage : msg)),
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
    const encryptedMsg = encryptMessage(messageInput);

    const tempId = "temp_" + Date.now().toString();
    const optimisticMessage: Message = {
      _id: tempId,
      groupId,
      userId: user._id,
      message: messageInput,
      createdAt: new Date().toISOString(),
      readBy: [user._id],
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageInput("");

    socket?.emit("sendMessage", {
      groupId,
      userId: user._id,
      message: encryptedMsg,
    });

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          userId: user._id,
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
          prev.map((msg) => (msg._id === tempId ? decryptedSavedMessage : msg)),
        );
        fetchSmartReplies(decryptedSavedMessage.message);
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 flex items-center">
            <div>
              <strong>
                {msg.userId === user._id ? user.name : msg.userId}:
              </strong>{" "}
              <span>{msg.message}</span>
              {msg.imageUrl && (
                <Image
                  src={msg.imageUrl}
                  alt="attached"
                  className="mt-2 max-w-xs rounded"
                  width={200} // Adjust width as needed
                  height={200} // Adjust height as needed
                />
              )}
            </div>
            {msg.userId === user._id && (
              <div className="ml-2">
                {msg.readBy && msg.readBy.length > 1 ? (
                  <FilledTickIcon />
                ) : (
                  <UnfilledTickIcon />
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"}{" "}
          typing...
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
          onKeyDown={handleTyping}
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
