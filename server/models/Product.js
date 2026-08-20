import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: String, required: true }, // e.g. "RS 200"
    image: { type: String, required: true },
    
    // Migrated fields
    description: {
      type: String,
      default: "Premium quality fresh grocery product.",
    },
    category: {
      type: String,
      default: "Grocery",
    },
    brand: {
      type: String,
      default: "Fresh",
    },
    stock: {
      type: Number,
      default: 100,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    warehouseLocation: {
      type: String,
      default: "Main Warehouse",
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 4.5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Default to null / admin if not set
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
