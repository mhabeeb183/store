const mongoose = require("mongoose");

const liveStreamSchema = new mongoose.Schema(
  {
    host: {
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
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled",
    },
    scheduledAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    currentViewerCount: {
      type: Number,
      default: 0,
    },
    peakViewerCount: {
      type: Number,
      default: 0,
    },
    chat: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: { type: String },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    thumbnail: {
      type: String,
      default: "",
    },
    roomId: {
      type: String,
      unique: true,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    liveAuction: {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },
      currentPrice: {
        type: Number,
        default: 0,
      },
      highestBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      highestBidderName: {
        type: String,
        default: "",
      },
      timerEnd: {
        type: Date,
        default: null,
      },
      bids: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          userName: {
            type: String,
          },
          amount: {
            type: Number,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      status: {
        type: String,
        enum: ["idle", "active", "ended", "sold"],
        default: "idle",
      },
    },
  },
  { timestamps: true }
);

liveStreamSchema.pre("save", function () {
  if (!this.roomId) {
    this.roomId = `stream_${this._id}`;
  }
});

const LiveStream =
  mongoose.models.LiveStream ||
  mongoose.model("LiveStream", liveStreamSchema);

module.exports = LiveStream;
