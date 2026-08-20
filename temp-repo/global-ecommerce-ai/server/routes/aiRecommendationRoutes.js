const express = require("express");

const {
  getPersonalizedRecommendations,
} = require(
  "../controllers/aiRecommendationController"
);

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  getPersonalizedRecommendations
);

module.exports = router;