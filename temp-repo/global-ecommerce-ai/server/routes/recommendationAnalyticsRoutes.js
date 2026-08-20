const express = require("express");

const router = express.Router();

const {
  getRecommendationAnalytics,
} = require(
  "../controllers/recommendationAnalyticsController"
);

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  admin,
  getRecommendationAnalytics
);

module.exports = router;