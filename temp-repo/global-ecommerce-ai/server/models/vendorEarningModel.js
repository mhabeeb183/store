const mongoose = require("mongoose");

const vendorEarningSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },

    orderAmount: {
      type: Number,
      required: true,
    },

    commissionPercent: {
      type: Number,
      default: 10,
    },

    commissionAmount: {
      type: Number,
      required: true,
    },

    vendorAmount: {
      type: Number,
      required: true,
    },

    affiliateCommission: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "credited"],
      default: "credited",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "VendorEarning",
  vendorEarningSchema
);