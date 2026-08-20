const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    bidTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const auctionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,   // optional — vendor can upload image directly
      default: null,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    startingPrice: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    reservePrice: {
      type: Number,
      default: 0,
    },
    bidIncrement: {
      type: Number,
      default: 10,
    },
    bids: [bidSchema],
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "ended", "sold", "cancelled"],
      default: "upcoming",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    images: [{ type: String }],
    totalBids: {
      type: Number,
      default: 0,
    },
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

auctionSchema.index({ endTime: 1, status: 1 });

const Auction =
  mongoose.models.Auction ||
  mongoose.model("Auction", auctionSchema);

module.exports = Auction;
