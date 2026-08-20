const RecommendationAnalytics = require(
  "../models/recommendationAnalyticsModel"
);

const getRecommendationAnalytics =
  async (req, res) => {
    try {
      const totalRecommendations =
        await RecommendationAnalytics.countDocuments(
          {
            action: "recommended",
          }
        );

      const totalClicks =
        await RecommendationAnalytics.countDocuments(
          {
            action: "clicked",
          }
        );

      const totalPurchases =
        await RecommendationAnalytics.countDocuments(
          {
            action: "purchased",
          }
        );

      const conversionRate =
        totalClicks > 0
          ? (
              (totalPurchases /
                totalClicks) *
              100
            ).toFixed(2)
          : 0;

      const topCategories =
        await RecommendationAnalytics.aggregate(
          [
            {
              $group: {
                _id: "$category",
                count: {
                  $sum: 1,
                },
              },
            },
            {
              $sort: {
                count: -1,
              },
            },
            {
              $limit: 5,
            },
          ]
        );

      const topBrands =
        await RecommendationAnalytics.aggregate(
          [
            {
              $group: {
                _id: "$brand",
                count: {
                  $sum: 1,
                },
              },
            },
            {
              $sort: {
                count: -1,
              },
            },
            {
              $limit: 5,
            },
          ]
        );

      res.json({
        success: true,

        totalRecommendations,

        totalClicks,

        totalPurchases,

        conversionRate,

        topCategories,

        topBrands,
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
  getRecommendationAnalytics,
};