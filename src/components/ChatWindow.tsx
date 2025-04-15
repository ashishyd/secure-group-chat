"use client";

import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  useCallback,
  useMemo,
} from "react";
import { decryptMessage, encryptMessage } from "@/lib/encrypt";
import { Message } from "@/types";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useBroadcast } from "@/hooks/useBroadcast";
import { debounce } from "lodash";
import { useMessages } from "@/hooks/useMessages";
import { useSmartReplies } from "@/hooks/useSmartReplies";

// Extract icons to memoized components
// eslint-disable-next-line react/display-name
const UnfilledTickIcon = React.memo(() => (
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
));

// eslint-disable-next-line react/display-name
const FilledTickIcon = React.memo(() => (
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
));

// Smart reply tag as a memoized component
// eslint-disable-next-line react/display-name
const SmartReplyTag = React.memo(
  ({ reply, onClick }: { reply: string; onClick: (reply: string) => void }) => (
    <Button
      onClick={() => onClick(reply)}
      className="inline-flex items-center bg-blue-100 text-blue-800 text-sm font-medium mr-2 mb-2 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span className="mr-1 text-lg">🤖</span>
      <span>{reply}</span>
    </Button>
  ),
);

interface ChatWindowProps {
  groupId: string;
}

// Main ChatWindow component
const ChatWindow = ({ groupId }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const socket = useSocket();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Use custom hooks
  const {
    messages,
    userIdToName,
    addMessage,
    updateMessage,
    updateReadReceipt,
    updateUserName,
  } = useMessages(groupId, user);

  const { smartReplies, fetchSmartReplies, clearSmartReplies } =
    useSmartReplies();

  if (!user) return <div>Loading user...</div>;

  // Handle socket events
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!socket || !user) return;

    // Join the group chat
    socket.emit("joinGroup", groupId);

    // Handle new messages
    const handleNewMessage = (data: Message) => {
      const decryptedMsg = decryptMessage(data.message);
      const incomingMessage: Message = {
        ...data,
        message: decryptedMsg,
        readBy: data.readBy || [],
      };

      // Check if this is an update to an existing optimistic message
      const optimisticMessage = messages.find(
        (msg) =>
          msg.userId === user.id &&
          msg.message === incomingMessage.message &&
          msg.id.startsWith("temp_"),
      );

      if (optimisticMessage) {
        updateMessage(optimisticMessage.id, incomingMessage);
      } else {
        addMessage(incomingMessage);

        // If message is from someone else, fetch smart replies
        if (data.userId !== user.id) {
          fetchSmartReplies(decryptedMsg);
        }
      }

      // Send read receipt
      socket.emit("readReceipt", {
        groupId,
        messageId: data.id,
        userId: user.id,
      });
    };

    // Handle read receipts
    const handleReadReceipt = (data: {
      messageId: string;
      userId: string;
      groupId: string;
    }) => {
      if (data.groupId !== groupId) return;
      updateReadReceipt(data.messageId, data.userId);
    };

    // Handle typing indicators
    const handleTyping = (data: {
      userId: string;
      groupId: string;
      userName?: string;
    }) => {
      if (data.groupId !== groupId || data.userId === user.id) return;

      // Update user name if provided
      if (data.userName) {
        updateUserName(data.userId, data.userName);
      }

      setTypingUsers((prev) => {
        if (!prev.includes(data.userId)) return [...prev, data.userId];
        return prev;
      });

      // Auto-remove after timeout
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }, 3000);
    };

    // Handle stop typing
    const handleStopTyping = (data: { userId: string; groupId: string }) => {
      if (data.groupId !== groupId) return;
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    };

    // Register event handlers
    socket.on("newMessage", handleNewMessage);
    socket.on("readReceipt", handleReadReceipt);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    // Cleanup
    return () => {
      socket.emit("leaveGroup", groupId);
      socket.off("newMessage", handleNewMessage);
      socket.off("readReceipt", handleReadReceipt);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [
    socket,
    groupId,
    user,
    messages,
    addMessage,
    updateMessage,
    updateReadReceipt,
    updateUserName,
    fetchSmartReplies,
  ]);

  // Auto-scroll to bottom when messages change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (messages.length > 0) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle typing broadcast via custom hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const broadcastTyping = useBroadcast(
    "chat-activity",
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCallback(
      (data) => {
        if (data.groupId !== groupId || data.userId === user?.id) return;

        if (data.type === "TYPING") {
          if (data.userName) {
            updateUserName(data.userId, data.userName);
          }

          setTypingUsers((prev) =>
            prev.includes(data.userId) ? prev : [...prev, data.userId],
          );

          // Auto-remove after timeout
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
          }, 3000);
        }

        if (data.type === "STOP_TYPING") {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }
      },
      [groupId, user?.id, updateUserName],
    ),
  );

  // Create memoized emit typing handler
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const emitTyping = useCallback(() => {
    if (!socket || !user) return;
    const payload = { groupId, userId: user.id, userName: user.name };
    socket.emit("typing", payload);
  }, [socket, groupId, user]);

  // Debounced typing event (runs max once per 300ms)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleTyping = useMemo(() => debounce(emitTyping, 300), [emitTyping]);

  // Clean up the debounce on unmount
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      handleTyping.cancel();
    };
  }, [handleTyping]);

  // Handle file selection
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!user || !socket) return;

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

            addMessage(optimisticMessage);

            socket.emit("sendMessage", {
              groupId,
              userId: user.id,
              message: encryptMessage(""),
              imageUrl,
            });

            try {
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
                const savedData = await saveRes.json();
                const finalMessage: Message = {
                  ...savedData.message,
                  imageUrl,
                  message: "",
                };
                updateMessage(tempId, finalMessage);
              } else {
                console.error("Failed to save message", await saveRes.text());
              }
            } catch (error) {
              console.error("Error saving message", error);
            }
          }
        } else {
          console.error("Image upload failed", await res.text());
        }
      } catch (error) {
        console.error("Error during image upload", error);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [user, socket, groupId, addMessage, updateMessage],
  );

  // File input trigger
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Send message handler
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !socket || !user) return;

    // Stop typing indicator
    socket.emit("stopTyping", { groupId, userId: user.id });
    broadcastTyping({ type: "STOP_TYPING", userId: user.id, groupId });

    const encryptedMsg = encryptMessage(messageInput);
    const tempId = "temp_" + Date.now().toString();

    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      groupId,
      userId: user.id,
      message: messageInput,
      createdAt: new Date().toISOString(),
      readBy: [user.id],
    };

    addMessage(optimisticMessage);
    setMessageInput("");
    clearSmartReplies();

    // Send via socket
    socket.emit("sendMessage", {
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
        updateMessage(tempId, decryptedSavedMessage);
      } else {
        console.error("Failed to save message", await res.text());
      }
    } catch (error) {
      console.error("Error saving message", error);
    }
  }, [
    messageInput,
    socket,
    user,
    groupId,
    addMessage,
    updateMessage,
    broadcastTyping,
    clearSmartReplies,
  ]);

  // Handle smart reply click
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleSmartReplyClick = useCallback(
    (reply: string) => {
      setMessageInput(reply);
      clearSmartReplies();
    },
    [clearSmartReplies],
  );

  // Handle key press for input
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  // Handle input blur
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleInputBlur = useCallback(() => {
    if (socket && user) {
      socket.emit("stopTyping", { groupId, userId: user.id });
    }
  }, [socket, groupId, user]);

  // Memoize message rendering function
  // eslint-disable-next-line react/display-name
  const MessageItem = React.memo(({ message }: { message: Message }) => {
    const isSender = message.userId === user?.id;
    return (
      <div
        className={`mb-2 flex ${isSender ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`p-2 rounded max-w-xs break-words ${isSender ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
        >
          <div className="text-xs mb-1">
            {isSender
              ? user?.name
              : message.userName ||
                userIdToName[message.userId] ||
                message.userId}
          </div>
          <div>{message.message}</div>
          {message.imageUrl && (
            <Image
              src={message.imageUrl}
              alt="attached"
              className="mt-1 max-w-xs rounded"
              width={200}
              height={200}
            />
          )}
          {isSender && (
            <div className="mt-1 flex justify-end">
              {message.readBy && message.readBy.length > 1 ? (
                <FilledTickIcon />
              ) : (
                <UnfilledTickIcon />
              )}
            </div>
          )}
        </div>
      </div>
    );
  });

  // Render typing indicator
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const renderTypingIndicator = useMemo(() => {
    if (typingUsers.length === 0) return null;

    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        {typingUsers.map((id, i) => (
          <span key={id}>
            {i > 0 && ", "}
            {userIdToName[id] ?? id}
          </span>
        ))}{" "}
        {typingUsers.length === 1 ? "is typing..." : "are typing..."}
      </div>
    );
  }, [typingUsers, userIdToName]);

  // Render smart replies
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const renderSmartReplies = useMemo(() => {
    if (smartReplies.length === 0) return null;

    return (
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
    );
  }, [smartReplies, handleSmartReplyClick]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <MessageItem key={msg.id || index} message={msg} />
        ))}
        <div ref={messageEndRef} />
      </div>

      {renderTypingIndicator}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      {renderSmartReplies}

      <div className="p-4 bg-white-100 border-t border-gray-100">
        <TextInput
          label=""
          name="chat"
          type="text"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            handleTyping();
            handleKeyPress(e);
          }}
          onBlur={handleInputBlur}
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

export default React.memo(ChatWindow);
