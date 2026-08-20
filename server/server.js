import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectToDb from "./config/db.js";

// Routes imports
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";

// Migrated routes imports
import vendorRoutes from "./routes/vendorRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";

// Socket setup
import setupSocket from "./socket/socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Bind Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow connections from all origins
    methods: ["GET", "POST"],
  },
});

// Setup socket listeners
setupSocket(io);

// Store io in express app context
app.set("io", io);

app.use(cors());
app.use(express.json());

// Routes mounting
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/users", userRoutes);
app.use("/orders", orderRoutes);
app.use("/api/chatbot", chatbotRoutes);

// Migrated routes mounting
app.use("/api/vendor", vendorRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/warehouses", warehouseRoutes);

// Health check route
app.get("/api/db-status", (req, res) => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.json({
    status: states[state] || "Unknown",
    readyState: state,
    isConnected: state === 1,
    databaseName: mongoose.connection.name || "N/A",
    host: mongoose.connection.host || "N/A",
  });
});

app.get("/", (req, res) => {
  res.send("Store Backend API is running with live Socket.IO capabilities...");
});

connectToDb().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
