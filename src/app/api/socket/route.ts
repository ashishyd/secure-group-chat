// src/app/api/socket/route.ts
import { Server as IOServer } from "socket.io";
import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "@/types/next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  if (!res.socket.server.io) {
    console.log("[SOCKET] Initializing Socket.IO server...");
    // @ts-expect-error -- res.socket.server.io is not defined in the type
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Basic socket event handlers
    io.on("connection", (socket) => {
      console.log(`[SOCKET] Connected: ${socket.id}`);

      socket.on("joinGroup", (groupId: string) => {
        socket.join(groupId);
        console.log(`[SOCKET] Socket ${socket.id} joined group ${groupId}`);
      });

      socket.on(
        "sendMessage",
        (data: {
          groupId: string;
          userId: string;
          message: string;
          imageUrl?: string;
        }) => {
          const message = {
            ...data,
            createdAt: new Date().toISOString(),
            readBy: [data.userId],
          };
          // Broadcast to everyone in the room, including the sender if needed.
          io.to(data.groupId).emit("newMessage", message);
        },
      );

      socket.on(
        "typing",
        (data: { groupId: string; userId: string; userName?: string }) => {
          socket.to(data.groupId).emit("typing", data);
        },
      );

      socket.on(
        "readReceipt",
        (data: { groupId: string; messageId: string; userId: string }) => {
          io.to(data.groupId).emit("readReceipt", data);
        },
      );

      socket.on("disconnect", () => {
        console.log(`[SOCKET] Disconnected: ${socket.id}`);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("[SOCKET] Socket.IO server already running.");
  }
  res.end();
}
