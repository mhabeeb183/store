const express = require("express");

const router = express.Router();

const {
  updateCustomPricing,
} = require(
  "../controllers/adminPricingController"
);

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

router.put(
  "/:id",
  protect,
  admin,
  updateCustomPricing
);

module.exports = router;