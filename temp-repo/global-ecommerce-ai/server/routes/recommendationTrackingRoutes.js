const express = require("express");

const router = express.Router();

const {
  trackRecommendation,
} = require(
  "../controllers/recommendationTrackingController"
);

const {
  protect,
} = require("../middleware/authMiddleware");

router.post(
  "/",
  protect,
  trackRecommendation
);

module.exports = router;