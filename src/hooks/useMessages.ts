import { useCallback, useEffect, useState } from "react";
import { Message, User } from "@/types";
import { decryptMessage } from "@/lib/encrypt";

export const useMessages = (groupId: string, user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userIdToName, setUserIdToName] = useState<Record<string, string>>({});

  // Fetch messages on mount (and when groupId changes)
  useEffect(() => {
    let isMounted = true;

    async function fetchMessages() {
      try {
        const response = await fetch(`/api/messages?groupId=${groupId}`);
        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.messages)) {
            const decryptedMessages = data.messages.map((msg: Message) => ({
              ...msg,
              message: decryptMessage(msg.message),
            }));

            setMessages(decryptedMessages);

            // Build a userId -> userName map from messages if provided
            const map: Record<string, string> = {};
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

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  // Function to add a message
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Avoid adding duplicate messages
      if (prev.some((msg) => msg.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  // Function to update a message
  const updateMessage = useCallback((tempId: string, newMessage: Message) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === tempId ? newMessage : msg)),
    );
  }, []);

  // Function to handle read receipts
  const updateReadReceipt = useCallback((messageId: string, userId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && !msg.readBy?.includes(userId)) {
          return { ...msg, readBy: [...(msg.readBy || []), userId] };
        }
        return msg;
      }),
    );
  }, []);

  // Update user name mapping
  const updateUserName = useCallback((userId: string, userName: string) => {
    setUserIdToName((prev) => {
      if (prev[userId] === userName) return prev;
      return { ...prev, [userId]: userName };
    });
  }, []);

  return {
    messages,
    userIdToName,
    addMessage,
    updateMessage,
    updateReadReceipt,
    updateUserName,
  };
};
