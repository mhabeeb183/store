const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: [
      {
        name: String,
        qty: Number,
        image: String,
        price: Number,

        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
    },

    paidPrice: {
      type: Number,
      default: 0,
    },

    //
    // REAL-TIME ORDER TRACKING
    //
    orderStatus: {
      type: String,
      enum: [
        "Order Placed",
        "Packed",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
    },

    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },

        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    cashbackGiven: {
      type: Boolean,
      default: false,
    },

    vendorEarningsProcessed: {
      type: Boolean,
      default: false,
    },

    //
    // ORDER CANCELLATION
    //
    isCancelled: {
      type: Boolean,
      default: false,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: null,
    },

    refundToWallet: {
      type: Boolean,
      default: false,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    shippingDetails: {
      name: { type: String, required: false },
      address: { type: String, required: false },
      mobile: { type: String, required: false },
    },

    paymentMethod: {
      type: String,
      enum: ["Razorpay", "Wallet", "COD"],
      default: "Razorpay",
    },
  },
  {
    timestamps: true,
  }
);

const Order =
  mongoose.models.Order ||
  mongoose.model(
    "Order",
    orderSchema
  );

module.exports = Order;