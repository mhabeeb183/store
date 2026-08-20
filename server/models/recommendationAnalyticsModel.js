import mongoose from "mongoose";

const recommendationAnalyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // can be null for guests
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      enum: ["recommended", "clicked", "purchased"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const RecommendationAnalytics = mongoose.models.RecommendationAnalytics || mongoose.model("RecommendationAnalytics", recommendationAnalyticsSchema);

export default RecommendationAnalytics;
