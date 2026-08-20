const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referralCode: {
      type: String,
      required: true,
      unique: true,
    },

    rewardAmount: {
      type: Number,
      default: 200,
    },

    rewardGiven: {
      type: Boolean,
      default: false,
    },

    clicks: {
      type: Number,
      default: 0,
    },

    registered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Referral =
  mongoose.models.Referral ||
  mongoose.model(
    "Referral",
    referralSchema
  );

module.exports = Referral;