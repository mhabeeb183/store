const jwt = require("jsonwebtoken");

const socketAuth = (io) => {
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error(
            "Authentication token missing"
          )
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      if (!decoded?.id) {
        return next(
          new Error(
            "Invalid token payload"
          )
        );
      }

      socket.user = {
        id: decoded.id,
        role: decoded.role,
        isAdmin: decoded.isAdmin,
      };

      next();
    } catch (error) {
      console.error(
        "Socket Auth Error:",
        error.message
      );

      return next(
        new Error("Authentication Failed")
      );
    }
  });
};

module.exports = socketAuth;