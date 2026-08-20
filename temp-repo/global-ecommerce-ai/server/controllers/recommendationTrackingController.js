const RecommendationAnalytics = require(
  "../models/recommendationAnalyticsModel"
);

const trackRecommendation =
  async (req, res) => {
    try {
      const {
        user,
        product,
        category,
        brand,
        action,
      } = req.body;

      const analytics =
        await RecommendationAnalytics.create({
          user,
          product,
          category,
          brand,
          action,
        });

      res.status(201).json({
        success: true,
        analytics,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

module.exports = {
  trackRecommendation,
};