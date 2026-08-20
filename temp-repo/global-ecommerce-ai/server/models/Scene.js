const mongoose = require("mongoose");

const sceneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    panoramaUrl: {
      type: String,
      required: true,
    },
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Scene",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Scene", sceneSchema);
