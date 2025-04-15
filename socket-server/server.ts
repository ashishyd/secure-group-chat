// server.ts
import express, { Application, Request, Response } from "express";
import { createServer, Server as HTTPServer } from "http";
import cors from "cors";
import { Server as IOServer, Socket } from "socket.io";

// Initialize Express app
const app: Application = express();

// Enable CORS (adjust origin as needed for production)
app.use(cors());

// Create HTTP server from the Express app
const httpServer: HTTPServer = createServer(app);

// Initialize Socket.IO server with custom configuration
const io = new IOServer(httpServer, {
  path: "/socket", // This is the endpoint your client will connect to (e.g., https://yourdomain.com/socket)
  cors: {
    origin: "*", // In production, restrict this to your Next.js app's domain
    methods: ["GET", "POST"],
  },
});

// Define Socket.IO event handlers
io.on("connection", (socket: Socket) => {
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
      // Attach a timestamp and an initial read receipt (the sender)
      const message = {
        ...data,
        createdAt: new Date().toISOString(),
        readBy: [data.userId],
      };
      // Broadcast to all clients in the group
      io.to(data.groupId).emit("newMessage", message);
      console.log(
        `[SOCKET] Message in group ${data.groupId} from ${data.userId}: ${data.message}`,
      );
    },
  );

  socket.on(
    "typing",
    (data: { groupId: string; userId: string; userName?: string }) => {
      // Broadcast typing status to everyone except the sender
      socket.to(data.groupId).emit("typing", data);
    },
  );

  socket.on("stopTyping", (data: { groupId: string; userId: string }) => {
    // Broadcast stop typing event
    socket.to(data.groupId).emit("stopTyping", data);
  });

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

// Define a simple route (for testing the server)
app.get("/", (req: Request, res: Response) => {
  res.send("Socket.IO Server is running!");
});

// Start the server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});
