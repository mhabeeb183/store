const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(
      `User Connected: ${socket.user.id}`
    );

    console.log(
      `Role: ${socket.user.role}`
    );

    console.log(
      `Socket ID: ${socket.id}`
    );

    //
    // JOIN ORDER ROOM
    //
    socket.on(
      "joinOrder",
      (orderId) => {
        const room = `order_${orderId}`;

        socket.join(room);

        console.log(
          `User ${socket.user.id} joined ${room}`
        );
      }
    );

    //
    // LEAVE ORDER ROOM
    //
    socket.on(
      "leaveOrder",
      (orderId) => {
        const room = `order_${orderId}`;

        socket.leave(room);

        console.log(
          `User ${socket.user.id} left ${room}`
        );
      }
    );

    //
    // DISCONNECT
    //
    socket.on(
      "disconnect",
      () => {
        console.log(
          `User Disconnected: ${socket.user.id}`
        );
      }
    );
  });
};

module.exports = setupSocket;