import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    duration: {
      type: Number, // duration in days
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    freeDelivery: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
