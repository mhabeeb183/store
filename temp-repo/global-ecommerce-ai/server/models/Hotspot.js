const mongoose = require("mongoose");

const hotspotSchema = new mongoose.Schema(
  {
    sceneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scene",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    targetSceneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scene",
      default: null,
    },
    pitch: {
      type: Number,
      required: true, // Spherical latitude angle in radians (-PI/2 to PI/2)
    },
    yaw: {
      type: Number,
      required: true, // Spherical longitude angle in radians (0 to 2*PI)
    },
    type: {
      type: String,
      enum: ["product", "teleport"],
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Hotspot", hotspotSchema);
