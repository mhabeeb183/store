import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    id: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

// Ensure a user can only have one entry per product in their cart
cartItemSchema.index({ userId: 1, id: 1 }, { unique: true });

export default mongoose.model("CartItem", cartItemSchema);
