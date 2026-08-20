const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String, required: true },
      zipCode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    capacity: {
      type: Number,
      required: true,
      default: 1000,
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: { type: Number, default: 0 },
        bin: { type: String, default: "A1" },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    zones: [
      {
        name: { type: String },
        type: {
          type: String,
          enum: ["storage", "packing", "shipping", "returns"],
        },
        capacity: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

const Warehouse =
  mongoose.models.Warehouse ||
  mongoose.model("Warehouse", warehouseSchema);

module.exports = Warehouse;
