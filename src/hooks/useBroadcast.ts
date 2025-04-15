import { useEffect, useRef } from "react";

export const useBroadcast = (
  channelName: string,
  onMessage: (msg: any) => void,
) => {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      onMessage(event.data);
    };

    return () => channel.close();
  }, [channelName, onMessage]);

  const postMessage = (data: any) => {
    channelRef.current?.postMessage(data);
  };

  return postMessage;
};
