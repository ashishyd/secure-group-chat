import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Custom React hook to manage a Socket.IO connection.
 *
 * @returns {Socket | null} The active Socket.IO instance or null if not connected.
 */
export const useSocket = (): Socket | null => {
  // State to store the current Socket.IO instance.
  const [socket, setSocket] = useState<Socket | null>(null);

  // Ref to hold the Socket.IO instance for consistent access across renders.
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize a new Socket.IO connection.
    // Replace "http://localhost:4000" with the URL of your Socket.IO server.
    const socketInstance = io("http://localhost:4000", {
      path: "/socket", // Specify the custom path for the Socket.IO server.
    });

    // Store the instance in the ref and state.
    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Cleanup function to disconnect the socket when the component unmounts.
    return () => {
      socketInstance.disconnect(); // Disconnect the socket.
      socketRef.current = null; // Clear the ref.
    };
  }, []); // Empty dependency array ensures this effect runs only once.

  // Return the current Socket.IO instance.
  return socket;
};
