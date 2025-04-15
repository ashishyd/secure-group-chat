import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Replace the URL with your deployed Socket.IO server URL.
    const socketInstance = io("http://localhost:4000", {
      path: "/socket",
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
