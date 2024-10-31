// events.ts
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const initializeSocket = (server: SocketIOServer) => {
  io = server;
};

export const emitOrderStatusUpdate = (
  orderId: string,
  status: string,
  userId: string
) => {
  if (io) {
    io.to(userId).emit("orderStatusUpdate", { orderId, status });
  } else {
    console.warn("Socket.IO não está inicializado.");
  }
};
