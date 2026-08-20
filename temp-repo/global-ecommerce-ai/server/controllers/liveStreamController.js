const LiveStream = require("../models/LiveStream");
const Order = require("../models/Order");
const { getProductionIceServers } = require("../services/turnService");

// Create/Schedule a live stream
const createLiveStream = async (req, res) => {
  try {
    const streamData = {
      ...req.body,
      host: req.user._id,
      roomId: `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };

    const stream = await LiveStream.create(streamData);
    res.status(201).json({ success: true, stream });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all live/upcoming streams
const getActiveStreams = async (req, res) => {
  try {
    const streams = await LiveStream.find({
      status: { $in: ["live", "scheduled"] },
    })
      .populate("host", "name")
      .populate("products", "name price images")
      .sort({ scheduledAt: 1 });

    res.json({ success: true, streams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get stream by ID
const getStreamById = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
      .populate("host", "name")
      .populate("products", "name price images description")
      .populate("liveAuction.product", "name price images description")
      .populate("viewers.user", "name");

    if (!stream) {
      return res.status(404).json({ success: false, message: "Stream not found" });
    }

    res.json({ success: true, stream });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Start live stream
const startStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({ success: false, message: "Stream not found" });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    stream.status = "live";
    stream.startedAt = new Date();
    await stream.save();

    // Notify via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("streamStarted", {
        streamId: stream._id,
        title: stream.title,
        host: req.user.name,
        roomId: stream.roomId,
      });
    }

    res.json({ success: true, stream });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// End live stream
const endStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);

    if (!stream) {
      return res.status(404).json({ success: false, message: "Stream not found" });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    stream.status = "ended";
    stream.endedAt = new Date();
    await stream.save();

    const io = req.app.get("io");
    if (io) {
      io.to(stream.roomId).emit("streamEnded", { streamId: stream._id });
    }

    res.json({ success: true, stream });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Join a stream as viewer
const joinStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);

    if (!stream || stream.status !== "live") {
      return res.status(400).json({ success: false, message: "Stream is not live" });
    }

    const alreadyViewing = stream.viewers.find(
      (v) => v.user && v.user.toString() === req.user._id.toString()
    );

    if (!alreadyViewing) {
      stream.viewers.push({ user: req.user._id });
      stream.currentViewerCount += 1;
      if (stream.currentViewerCount > stream.peakViewerCount) {
        stream.peakViewerCount = stream.currentViewerCount;
      }
      await stream.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.to(stream.roomId).emit("viewerJoined", {
        viewerCount: stream.currentViewerCount,
      });
    }

    res.json({ success: true, stream });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send chat message in stream
const sendStreamChat = async (req, res) => {
  try {
    const { message } = req.body;
    const stream = await LiveStream.findById(req.params.id);

    if (!stream || stream.status !== "live") {
      return res.status(400).json({ success: false, message: "Stream is not live" });
    }

    const chatMessage = {
      user: req.user._id,
      userName: req.user.name,
      message,
      timestamp: new Date(),
    };

    stream.chat.push(chatMessage);
    await stream.save();

    const io = req.app.get("io");
    if (io) {
      io.to(stream.roomId).emit("streamChat", chatMessage);
    }

    res.json({ success: true, chatMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get vendor's streams
const getMyStreams = async (req, res) => {
  try {
    const streams = await LiveStream.find({ host: req.user._id })
      .populate("products", "name price images")
      .sort({ createdAt: -1 });

    res.json({ success: true, streams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── LIVE AUCTION CONTROLLERS ──────────────────────────────────────────────────
const activeLiveAuctions = {}; // streamId -> { timeoutId, timerEnd }

// Helper: Auto resolve live auction when 1 minute expires
const autoResolveLiveAuction = async (streamId, io) => {
  try {
    const stream = await LiveStream.findById(streamId);
    if (!stream || stream.liveAuction.status !== "active") return;

    if (stream.liveAuction.highestBidder) {
      stream.liveAuction.status = "ended";
    } else {
      stream.liveAuction.status = "idle";
    }
    await stream.save();

    if (io) {
      io.to(stream.roomId).emit("liveAuctionEnded", stream.liveAuction);
    }
    
    if (activeLiveAuctions[streamId]) {
      delete activeLiveAuctions[streamId];
    }
  } catch (err) {
    console.error("Auto resolve live auction error:", err);
  }
};

// Start live auction (vendor only)
const startLiveAuction = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ success: false, message: "Stream not found" });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: only the host can start an auction" });
    }

    const { productId, startingPrice } = req.body;
    if (!productId || !startingPrice) {
      return res.status(400).json({ success: false, message: "Product ID and starting price are required" });
    }

    const timerEnd = new Date(Date.now() + 60000); // 1 minute from now

    stream.liveAuction = {
      product: productId,
      currentPrice: Number(startingPrice),
      highestBidder: null,
      highestBidderName: "",
      timerEnd,
      bids: [],
      status: "active",
    };

    await stream.save();
    
    // Populate product details for client
    const populatedStream = await LiveStream.findById(stream._id)
      .populate("liveAuction.product", "name price images description");

    const io = req.app.get("io");
    if (io) {
      io.to(stream.roomId).emit("liveAuctionStarted", populatedStream.liveAuction);
    }

    // Set server-side auto-resolution timer
    if (activeLiveAuctions[stream._id]) {
      clearTimeout(activeLiveAuctions[stream._id].timeoutId);
    }
    const timeoutId = setTimeout(() => {
      autoResolveLiveAuction(stream._id, io);
    }, 60000);

    activeLiveAuctions[stream._id] = { timeoutId, timerEnd };

    res.json({ success: true, liveAuction: populatedStream.liveAuction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Place live bid
const placeLiveBid = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ success: false, message: "Stream not found" });
    }

    if (stream.liveAuction.status !== "active") {
      return res.status(400).json({ success: false, message: "No active auction right now" });
    }

    const { bidAmount } = req.body;
    if (!bidAmount) {
      return res.status(400).json({ success: false, message: "Bid amount is required" });
    }

    if (Number(bidAmount) <= stream.liveAuction.currentPrice) {
      return res.status(400).json({
        success: false,
        message: `Bid must be higher than current price of ₹${stream.liveAuction.currentPrice}`,
      });
    }

    const timerEnd = new Date(Date.now() + 60000); // reset 1 minute timer

    stream.liveAuction.currentPrice = Number(bidAmount);
    stream.liveAuction.highestBidder = req.user._id;
    stream.liveAuction.highestBidderName = req.user.name;
    stream.liveAuction.timerEnd = timerEnd;
    stream.liveAuction.bids.push({
      user: req.user._id,
      userName: req.user.name,
      amount: Number(bidAmount),
      timestamp: new Date(),
    });

    await stream.save();

    const populatedStream = await LiveStream.findById(stream._id)
      .populate("liveAuction.product", "name price images description");

    const io = req.app.get("io");
    if (io) {
      io.to(stream.roomId).emit("liveAuctionBid", populatedStream.liveAuction);
    }

    // Reset resolution timer
    if (activeLiveAuctions[stream._id]) {
      clearTimeout(activeLiveAuctions[stream._id].timeoutId);
    }
    const timeoutId = setTimeout(() => {
      autoResolveLiveAuction(stream._id, io);
    }, 60000);

    activeLiveAuctions[stream._id] = { timeoutId, timerEnd };

    res.json({ success: true, liveAuction: populatedStream.liveAuction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Checkout/Pay won live auction
const checkoutLiveAuction = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
      .populate("liveAuction.product");
    if (!stream) {
      return res.status(404).json({ success: false, message: "Stream not found" });
    }

    if (stream.liveAuction.status !== "ended") {
      return res.status(400).json({ success: false, message: "No ended auction to pay for" });
    }

    if (stream.liveAuction.highestBidder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: you did not win this auction" });
    }

    const { shippingAddress } = req.body;
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "Shipping address is required" });
    }

    const product = stream.liveAuction.product;
    const finalPrice = stream.liveAuction.currentPrice;

    // Create final order in Database
    const orderData = {
      user: req.user._id,
      orderItems: [
        {
          name: product.name,
          qty: 1,
          image: product.images?.[0] || "",
          price: finalPrice,
          product: product._id,
        },
      ],
      totalPrice: finalPrice,
      isPaid: true,
      paidAt: new Date(),
      paidPrice: finalPrice,
    };

    const order = await Order.create(orderData);

    // Reset live auction back to idle
    const winningUserName = stream.liveAuction.highestBidderName;
    stream.liveAuction.status = "sold";
    await stream.save();

    const io = req.app.get("io");
    if (io) {
      io.to(stream.roomId).emit("liveAuctionPaid", {
        productId: product._id,
        productName: product.name,
        price: finalPrice,
        winnerName: winningUserName,
        orderId: order._id,
      });
    }

    // Reset livestream's liveAuction object for next auctions
    setTimeout(async () => {
      try {
        const resetStream = await LiveStream.findById(stream._id);
        resetStream.liveAuction = {
          product: null,
          currentPrice: 0,
          highestBidder: null,
          highestBidderName: "",
          timerEnd: null,
          bids: [],
          status: "idle",
        };
        await resetStream.save();
        if (io) {
          io.to(stream.roomId).emit("liveAuctionReset");
        }
      } catch (err) {
        console.error("Live auction reset error:", err);
      }
    }, 5000); // Reset to idle 5 seconds after payment completed banner displays

    res.status(201).json({ success: true, order, message: "Order processed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add product to live stream dynamically
const addProductToLiveStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ success: false, message: "Stream not found" });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    if (!stream.products.includes(productId)) {
      stream.products.push(productId);
      await stream.save();
    }

    const populatedStream = await LiveStream.findById(stream._id)
      .populate("products", "name price images description");

    const io = req.app.get("io");
    if (io) {
      io.to(stream.roomId).emit("streamProductsUpdated", populatedStream.products);
    }

    res.json({ success: true, products: populatedStream.products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dynamically resolved STUN/TURN ICE config
const getIceServers = async (req, res) => {
  try {
    const iceServers = await getProductionIceServers();
    res.json({ success: true, iceServers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLiveStream,
  getActiveStreams,
  getStreamById,
  startStream,
  endStream,
  joinStream,
  sendStreamChat,
  getMyStreams,
  startLiveAuction,
  placeLiveBid,
  checkoutLiveAuction,
  addProductToLiveStream,
  getIceServers,
};
