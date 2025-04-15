// This hook provides functionality to fetch smart reply suggestions from an API endpoint
// based on a given message. It manages the state for suggestions, loading, and error handling.

import { useState } from "react";
import { SmartReplyResponse } from "@/types";

/**
 * Custom React hook to fetch smart reply suggestions.
 *
 * @returns {Object} - An object containing:
 *   - `suggestions` {string[]} - The list of smart reply suggestions.
 *   - `loading` {boolean} - Indicates whether the API request is in progress.
 *   - `error` {string | null} - Error message if the API request fails.
 *   - `fetchSmartReplies` {Function} - Function to fetch smart replies for a given message.
 */
export function useSmartReply() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches smart reply suggestions from the API.
   *
   * @param {string} message - The input message for which to fetch smart replies.
   * @returns {Promise<void>} - A promise that resolves when the API call is complete.
   */
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
