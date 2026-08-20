const mongoose = require("mongoose");

const fraudLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "rapid_orders",
        "high_value_order",
        "multiple_failed_payments",
        "suspicious_ip",
        "account_takeover",
        "velocity_check",
        "address_mismatch",
        "card_testing",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      ip: { type: String },
      userAgent: { type: String },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      amount: { type: Number },
      failedAttempts: { type: Number },
      location: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "false_positive"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: {
      type: String,
    },
    actionTaken: {
      type: String,
      enum: ["none", "flagged", "blocked", "refunded", "account_suspended"],
      default: "none",
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

fraudLogSchema.index({ user: 1, type: 1 });
fraudLogSchema.index({ severity: 1, status: 1 });

const FraudLog =
  mongoose.models.FraudLog ||
  mongoose.model("FraudLog", fraudLogSchema);

module.exports = FraudLog;
