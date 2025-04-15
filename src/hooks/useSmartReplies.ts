import { useCallback, useState } from "react";

export const useSmartReplies = () => {
  const [smartReplies, setSmartReplies] = useState<string[]>([]);

  const fetchSmartReplies = useCallback(async (messageText: string) => {
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
  }, []);

  const clearSmartReplies = useCallback(() => {
    setSmartReplies([]);
  }, []);

  return { smartReplies, fetchSmartReplies, clearSmartReplies };
};
