import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to your custom API route endpoint for Socket.IO
    const socketInstance = io("", {
      path: "/api/socket",
      transports: ["websocket"],
    });
    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socket;
};
