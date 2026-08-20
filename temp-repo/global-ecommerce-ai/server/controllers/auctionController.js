const Auction = require("../models/Auction");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "auction_images" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// Create auction
const createAuction = async (req, res) => {
  try {
    let imageUrl = "";

    // Upload image to Cloudinary if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const auctionData = {
      title:         req.body.title,
      description:   req.body.description || "",
      startingPrice: Number(req.body.startingPrice),
      bidIncrement:  Number(req.body.bidIncrement) || 10,
      startTime:     req.body.startTime,
      endTime:       req.body.endTime,
      seller:        req.user._id,
      currentPrice:  Number(req.body.startingPrice),
      images:        imageUrl ? [imageUrl] : [],
      // product is now optional
      ...(req.body.product && { product: req.body.product }),
    };

    const auction = await Auction.create(auctionData);
    res.status(201).json({ success: true, auction });
  } catch (error) {
    console.error("Create Auction Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all active auctions
const getActiveAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({
      status: { $in: ["active", "upcoming"] },
    })
      .populate("product", "name images price")
      .populate("seller", "name")
      .populate("highestBidder", "name")
      .sort({ endTime: 1 });

    res.json({ success: true, auctions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get auction by ID
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate("product", "name images price description")
      .populate("seller", "name")
      .populate("highestBidder", "name")
      .populate("bids.user", "name")
      .populate("winner", "name email");

    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }

    // Auto-update status based on time
    const now = new Date();
    if (auction.status === "upcoming" && now >= auction.startTime) {
      auction.status = "active";
      await auction.save();
    }
    if (auction.status === "active" && now >= auction.endTime) {
      auction.status = "ended";
      if (auction.highestBidder) {
        auction.winner = auction.highestBidder;
        auction.status = "sold";
      }
      await auction.save();
    }

    res.json({ success: true, auction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Place a bid
const placeBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }

    // Validate auction is active
    const now = new Date();
    if (now < auction.startTime) {
      return res.status(400).json({ success: false, message: "Auction has not started yet" });
    }
    if (now > auction.endTime || auction.status === "ended" || auction.status === "sold") {
      return res.status(400).json({ success: false, message: "Auction has ended" });
    }

    // Validate bid amount
    const minimumBid = auction.currentPrice + auction.bidIncrement;
    if (amount < minimumBid) {
      return res.status(400).json({
        success: false,
        message: `Minimum bid is ₹${minimumBid}`,
      });
    }

    // Cannot bid on own auction
    if (auction.seller.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot bid on your own auction" });
    }

    // Place the bid
    auction.bids.push({ user: userId, amount });
    auction.currentPrice = amount;
    auction.highestBidder = userId;
    auction.totalBids = auction.bids.length;
    auction.status = "active";

    await auction.save();

    // Emit real-time bid update via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`auction_${auction._id}`).emit("newBid", {
        auctionId: auction._id,
        amount,
        bidderId: userId,
        totalBids: auction.totalBids,
        currentPrice: auction.currentPrice,
      });
    }

    res.json({ success: true, auction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my auctions (seller)
const getMyAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.user._id })
      .populate("product", "name images price")
      .populate("highestBidder", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, auctions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel auction
const cancelAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }

    if (auction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (auction.bids.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel auction with existing bids",
      });
    }

    auction.status = "cancelled";
    await auction.save();

    res.json({ success: true, message: "Auction cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAuction,
  getActiveAuctions,
  getAuctionById,
  placeBid,
  getMyAuctions,
  cancelAuction,
};
