const { getPersonalizedAIRecommendations } = require("../services/tensorflowRecommendation");

const getPersonalizedRecommendations =
  async (req, res) => {
    try {
      const userId = req.user._id;
      const products = await getPersonalizedAIRecommendations(userId, 10);

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

module.exports = {
  getPersonalizedRecommendations,
};