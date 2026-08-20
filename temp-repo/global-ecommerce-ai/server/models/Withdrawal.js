const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    vendorEarning: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorEarning",
      required: false,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Withdrawal",
  withdrawalSchema
);