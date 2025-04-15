"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(endpoint?: string): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // If no endpoint is provided, defaults to the same origin.
    const socketInstance = io(endpoint || "");
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [endpoint]);

  return socket;
}
