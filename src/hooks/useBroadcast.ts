import { useEffect, useRef } from "react";

/**
 * Custom React hook to create and manage a `BroadcastChannel` for inter-tab communication.
 *
 * @param {string} channelName - The name of the broadcast channel to create.
 * @param {(msg: any) => void} onMessage - Callback function to handle incoming messages.
 * @returns {(data: any) => void} - A function to post messages to the broadcast channel.
 *
 * @example
 * const postMessage = useBroadcast("my-channel", (msg) => {
 *   console.log("Received message:", msg);
 * });
 *
 * postMessage({ key: "value" });
 */
export const useBroadcast = (
  channelName: string,
  onMessage: (msg: any) => void,
): ((data: any) => void) => {
  // Reference to the BroadcastChannel instance
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Create a new BroadcastChannel with the given name
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    // Set up the onmessage handler to invoke the provided callback
    channel.onmessage = (event) => {
      onMessage(event.data);
    };

    // Cleanup: Close the channel when the component unmounts or channelName changes
    return () => channel.close();
  }, [channelName, onMessage]);

  /**
   * Function to post a message to the broadcast channel.
   *
   * @param {any} data - The data to send through the broadcast channel.
   */
  const postMessage = (data: any) => {
    channelRef.current?.postMessage(data);
  };

  return postMessage;
};
