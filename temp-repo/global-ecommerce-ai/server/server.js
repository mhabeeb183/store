const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from environment variables");
}

// Redis
const { connectRedis } = require("./config/redis");

const socketAuth = require(
  "./socket/socketAuth"
);

// Existing Routes
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminAnalyticsRoutes = require(
  "./routes/adminAnalyticsRoutes"
);
const recommendationRoutes = require(
  "./routes/recommendationRoutes"
);
const wishlistRoutes = require(
  "./routes/wishlistRoutes"
);
const walletRoutes = require(
  "./routes/walletRoutes"
);
const vendorEarningRoutes = require(
  "./routes/vendorEarningRoutes"
);
const withdrawalRoutes = require(
  "./routes/withdrawalRoutes"
);
const dynamicPricingRoutes =
  require(
    "./routes/dynamicPricingRoutes"
  );
const vendorPricingRoutes =
  require(
    "./routes/vendorPricingRoutes"
  );
  const adminPricingRoutes = require(
  "./routes/adminPricingRoutes"
);
const chatbotRoutes = require(
  "./routes/chatbotRoutes"
);
const aiRecommendationRoutes = require(
  "./routes/aiRecommendationRoutes"
);
const recommendationAnalyticsRoutes = require(
  "./routes/recommendationAnalyticsRoutes"
);
const recommendationTrackingRoutes = require(
  "./routes/recommendationTrackingRoutes"
);
const affiliateRoutes = require(
  "./routes/affiliateRoutes"
);
const couponRoutes = require(
  "./routes/couponRoutes"
);
const subscriptionRoutes = require("./routes/subscriptionRoutes");

// New Routes
const warehouseRoutes = require("./routes/warehouseRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const liveStreamRoutes = require("./routes/liveStreamRoutes");
const fraudRoutes = require("./routes/fraudRoutes");
const vendorRequestRoutes = require("./routes/vendorRequestRoutes");
const sceneRoutes = require("./routes/sceneRoutes");
const hotspotRoutes = require("./routes/hotspotRoutes");

const app = express();
app.disable("x-powered-by");

// Remove the Server header to prevent version/server information leakage
app.use((req, res, next) => {
  res.removeHeader("Server");
  next();
});

// Global response interceptor to mask internal errors and sanitize CastErrors
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (obj) {
    if (obj && obj.message && (obj.message.includes("Cast to ObjectId") || obj.message.includes("ObjectId failed"))) {
      res.status(400);
      return originalJson.call(this, { message: "Invalid ID format" });
    }
    if (res.statusCode === 500) {
      console.error(`[500 Error Intercepted on ${req.method} ${req.url}]:`, obj);
      return originalJson.call(this, { message: "Internal Server Error" });
    }
    return originalJson.call(this, obj);
  };
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression
app.use(compression());

// Permissions-Policy
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(self), camera=(self)");
  next();
});

// Helmet security headers config
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://placehold.co",
          "https://via.placeholder.com",
          "https://api.qrserver.com"
        ],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "http://localhost:5173",
          "ws://localhost:5000",
          "https://api.razorpay.com",
          "https://res.cloudinary.com",
          "wss://localhost:5000"
        ],
        fontSrc: ["'self'", "data:"],
        workerSrc: ["'self'", "blob:"],
        frameSrc: ["'self'", "https://api.razorpay.com"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        manifestSrc: ["'self'"],
        mediaSrc: ["'self'", "blob:", "data:", "https://res.cloudinary.com"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    originAgentCluster: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);

// HSTS (Strict-Transport-Security)
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  })
);

// CORS Config
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//
// ROUTES
//
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use(
  "/api/admin",
  adminAnalyticsRoutes
);
app.use(
  "/api/recommendations",
  recommendationRoutes
);
app.use(
  "/api/wishlist",
  wishlistRoutes
);
app.use(
  "/api/wallet",
  walletRoutes
);
app.use(
  "/api/vendor-earnings",
  vendorEarningRoutes
);
app.use(
  "/api/withdrawals",
  withdrawalRoutes
);
app.use(
  "/api/dynamic-pricing",
  dynamicPricingRoutes
);
app.use("/api/chatbot", chatbotRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

app.use(
  "/api/vendor-pricing",
  vendorPricingRoutes
);
app.use(
  "/api/admin-pricing",
  adminPricingRoutes
);
app.use(
  "/api/ai-recommendations",
  aiRecommendationRoutes
);
app.use(
  "/api/recommendation-analytics",
  recommendationAnalyticsRoutes
);
app.use(
  "/api/recommendation-tracking",
  recommendationTrackingRoutes
);
app.use(
  "/api/affiliate",
  affiliateRoutes
);
app.use(
  "/api/coupons",
  couponRoutes
);
app.use("/api/subscriptions", subscriptionRoutes);

// New Feature Routes
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/livestreams", liveStreamRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/vendor-requests", vendorRequestRoutes);
app.use("/api/scenes", sceneRoutes);
app.use("/api/hotspots", hotspotRoutes);

//
// HTTP SERVER
//
const server = http.createServer(app);

//
// SOCKET SERVER
//
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    credentials: true,
    methods: ["GET", "POST"]
  },
});

//
// JWT SOCKET AUTH
//
socketAuth(io);

//
// MAKE IO AVAILABLE EVERYWHERE
//
app.set("io", io);

//
// SOCKET EVENTS
//
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

  // Join user's personal room for targeted alerts
  socket.join(`user_${socket.user.id}`);

  //
  // JOIN ORDER ROOM
  //
  socket.on("joinOrder", (orderId) => {
    const room = `order_${orderId}`;

    socket.join(room);

    console.log(
      `User ${socket.user.id} joined ${room}`
    );
  });

  //
  // LEAVE ORDER ROOM
  //
  socket.on("leaveOrder", (orderId) => {
    const room = `order_${orderId}`;

    socket.leave(room);

    console.log(
      `User ${socket.user.id} left ${room}`
    );
  });

  //
  // AUCTION EVENTS
  //
  socket.on("joinAuction", (auctionId) => {
    const room = `auction_${auctionId}`;
    socket.join(room);
    console.log(`User ${socket.user.id} joined auction ${room}`);
  });

  socket.on("leaveAuction", (auctionId) => {
    const room = `auction_${auctionId}`;
    socket.leave(room);
    console.log(`User ${socket.user.id} left auction ${room}`);
  });

  //
  // LIVE STREAM EVENTS
  //
  socket.on("joinStream", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.user.id} joined stream ${roomId}`);
    io.to(roomId).emit("viewerUpdate", {
      userId: socket.user.id,
      action: "joined",
    });
  });

  socket.on("leaveStream", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.user.id} left stream ${roomId}`);
    io.to(roomId).emit("viewerUpdate", {
      userId: socket.user.id,
      action: "left",
    });
  });

  // WebRTC Signaling for Live Streaming
  // Targeted peer-to-peer signal (host → specific viewer, viewer → host)
  socket.on("peer-signal", ({ to, signal }) => {
    io.to(to).emit("peer-signal", { from: socket.id, signal });
  });

  // Viewer notifies host (and room) that they are ready to receive stream
  socket.on("viewer-ready", ({ roomId }) => {
    socket.to(roomId).emit("viewer-ready", { viewerId: socket.id });
  });

  // Keep legacy broadcast events for backwards compatibility
  socket.on("stream-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("stream-offer", { offer, from: socket.id });
  });

  socket.on("stream-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("stream-answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate, from: socket.id });
  });


  //
  // DISCONNECT
  //
  socket.on("disconnect", () => {
    console.log(
      `User Disconnected: ${socket.user.id}`
    );
  });
});

// Custom 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route Not Found" });
});

// Custom 500 Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

//
// DATABASE CONNECTION + REDIS
//
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect Redis (non-blocking)
    await connectRedis().catch((err) =>
      console.log("Redis skipped:", err.message)
    );

    // Connect MongoDB with fallback
    try {
      console.log("Connecting to MongoDB...");

      await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      });
      console.log("MongoDB Connected to Atlas");
    } catch (dbErr) {
      console.log("MongoDB Atlas connection failed:", dbErr.message);
      console.log("Starting fallback in-memory MongoDB server...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log("Fallback In-Memory MongoDB Connected successfully at:", mongoUri);
    }

    // Seed initial database
    const seedDatabase = require("./utils/seeder");
    await seedDatabase();

    server.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server Startup Error:",
      error
    );
  }
};

startServer();
// Reload to apply new environment variables