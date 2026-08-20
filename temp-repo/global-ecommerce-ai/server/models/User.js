
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
    subscription: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "UserSubscription",
  default: null,
},

isSubscribed: {
  type: Boolean,
  default: false,
},

subscriptionExpiry: {
  type: Date,
  default: null,
},

    role: {
      type: String,
      enum: ["user", "admin", "vendor"],
      default: "user",
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    walletBalance: {
    type: Number,
    default: 0,
},
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );

module.exports = User;

