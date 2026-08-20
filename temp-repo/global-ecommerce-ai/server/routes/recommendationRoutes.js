const express = require("express");

const router = express.Router();

const {
  getRecommendations,
} = require(
  "../controllers/recommendationController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

// GET PRODUCT RECOMMENDATIONS
router.get(
  "/:id",
  protect,
  getRecommendations
);

module.exports = router;