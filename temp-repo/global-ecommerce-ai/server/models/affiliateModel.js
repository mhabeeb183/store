const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema(
  {
    affiliateUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    affiliateCode: {
      type: String,
      required: true,
    },

    commissionRate: {
      type: Number,
      default: 5,
    },

    orderAmount: {
      type: Number,
      default: 0,
    },

    commissionEarned: {
      type: Number,
      default: 0,
    },

    clicks: {
      type: Number,
      default: 0,
    },

    isConverted: {
      type: Boolean,
      default: false,
    },

    rewardGiven: {
  type: Boolean,
  default: false,
},

firstOrderCompleted: {
  type: Boolean,
  default: false,
},

    payoutStatus: {
      type: String,
      enum: ["Pending", "Approved", "Paid"],
      default: "Pending",
    },

    convertedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Affiliate =
  mongoose.models.Affiliate ||
  mongoose.model(
    "Affiliate",
    affiliateSchema
  );

module.exports = Affiliate;