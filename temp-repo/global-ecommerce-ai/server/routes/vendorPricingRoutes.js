const express = require("express");

const router = express.Router();

const {
  updatePricingSettings,
} = require(
  "../controllers/vendorPricingController"
);

const {
  protect,
  vendor,
} = require(
  "../middleware/authMiddleware"
);

router.put(
  "/:id",
  protect,
  vendor,
  updatePricingSettings
);

module.exports = router;