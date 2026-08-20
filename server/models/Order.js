import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        id: { type: Number, required: true }, // custom numeric ID
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false }, // Mongo _id
        name: { type: String, required: true },
        price: { type: String, required: true },
        image: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "Order Placed",
        "Processing",
        "Packed",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
    },
    shippingAddress: { type: String, required: true },
    contactNumber: { type: String, required: true },
    
    // Migrated fields
    paymentMethod: {
      type: String,
      enum: ["Razorpay", "Wallet", "COD"],
      default: "Razorpay",
    },
    discount: {
      type: Number,
      default: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    cashbackGiven: {
      type: Boolean,
      default: false,
    },
    vendorEarningsProcessed: {
      type: Boolean,
      default: false,
    },
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
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
