const mongoose = require("mongoose");

const recommendationAnalyticsSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },

      category: String,

      brand: String,

      action: {
        type: String,
        enum: [
          "recommended",
          "clicked",
          "purchased",
        ],
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "RecommendationAnalytics",
  recommendationAnalyticsSchema
);