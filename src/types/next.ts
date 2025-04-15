import { Server as IOServer } from "socket.io";
import { Socket } from "net";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: {
      io?: IOServer;
    };
  };
};
