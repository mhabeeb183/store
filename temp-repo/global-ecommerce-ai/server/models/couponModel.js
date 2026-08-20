const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },

    discountValue: {
      type: Number,
      required: true,
    },

    minOrderAmount: {
      type: Number,
      default: 1000,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      default: "Referral Reward",
    },
  },
  {
    timestamps: true,
  }
);

const Coupon =
  mongoose.models.Coupon ||
  mongoose.model(
    "Coupon",
    couponSchema
  );

module.exports = Coupon;