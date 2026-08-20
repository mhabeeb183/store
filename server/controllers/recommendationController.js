import Product from "../models/Product.js";
import RecommendationAnalytics from "../models/recommendationAnalyticsModel.js";
import { getAIRecommendations, getPersonalizedAIRecommendations } from "../services/tensorflowRecommendation.js";

// Fetch category/brand similarity products and log impressions
export const getRecommendations = async (req, res) => {
  try {
    const currentProduct = await Product.findById(req.params.id);

    if (!currentProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const recommendations = await getAIRecommendations(currentProduct._id, 4);

    // Track recommendation impressions asynchronously
    try {
      const userId = req.user?.id || null;

      if (recommendations.length > 0) {
        const analyticsData = recommendations.map((product) => ({
          user: userId,
          product: product._id,
          category: product.category || "Grocery",
          brand: product.brand || "Fresh",
          action: "recommended",
        }));

        await RecommendationAnalytics.insertMany(analyticsData);
      }
    } catch (trackingError) {
      console.error("Recommendation Tracking Error:", trackingError.message);
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Fetch personalized recommendations based on previous order items
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = await getPersonalizedAIRecommendations(userId, 8);

    // Track personalized impressions
    try {
      if (recommendations.length > 0) {
        const analyticsData = recommendations.map((product) => ({
          user: userId,
          product: product._id,
          category: product.category || "Grocery",
          brand: product.brand || "Fresh",
          action: "recommended",
        }));
        await RecommendationAnalytics.insertMany(analyticsData);
      }
    } catch (trackingError) {
      console.error("Personalized Tracking Error:", trackingError.message);
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Record recommendation click
export const trackRecommendationClick = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user?.id || null;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const clickedEvent = await RecommendationAnalytics.create({
      user: userId,
      product: product._id,
      category: product.category || "Grocery",
      brand: product.brand || "Fresh",
      action: "clicked",
    });

    res.status(201).json({ success: true, clickedEvent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
