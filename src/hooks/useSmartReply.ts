// This hook calls your smart reply API endpoint to fetch suggestions based on a given message

import { useState } from "react";
import { SmartReplyResponse } from "@/types";

export function useSmartReply() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSmartReplies(message: string): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/smart-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data: SmartReplyResponse = await response.json();
      setSuggestions(data.suggestions);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to fetch smart replies.");
      } else {
        setError("Failed to fetch smart replies.");
      }
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  return { suggestions, loading, error, fetchSmartReplies };
}
