import jwt from "jsonwebtoken";

export const setupSocket = (io) => {
  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");

      if (!decoded?.id) {
        return next(new Error("Invalid token payload"));
      }

      socket.user = {
        id: decoded.id,
        role: decoded.role,
      };

      next();
    } catch (error) {
      console.error("Socket Auth Error:", error.message);
      return next(new Error("Authentication Failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket User Connected: ${socket.user.id} (Role: ${socket.user.role}, SocketID: ${socket.id})`);

    // Join order room
    socket.on("joinOrder", (orderId) => {
      const room = `order_${orderId}`;
      socket.join(room);
      console.log(`Socket User ${socket.user.id} joined room ${room}`);
    });

    // Leave order room
    socket.on("leaveOrder", (orderId) => {
      const room = `order_${orderId}`;
      socket.leave(room);
      console.log(`Socket User ${socket.user.id} left room ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket User Disconnected: ${socket.user.id}`);
    });
  });
};
export default setupSocket;
