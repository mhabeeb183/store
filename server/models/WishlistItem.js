import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    id: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

// Ensure a user can only have one entry per product in their wishlist
wishlistItemSchema.index({ userId: 1, id: 1 }, { unique: true });

export default mongoose.model("WishlistItem", wishlistItemSchema);
