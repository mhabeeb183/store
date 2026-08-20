const express = require("express");

const router = express.Router();

const {
  getVendorDynamicPricing,
} = require(
  "../controllers/dynamicPricingController"
);

const {
  protect,
  vendor,
} = require(
  "../middleware/authMiddleware"
);

router.get(
  "/vendor",
  protect,
  vendor,
  getVendorDynamicPricing
);

module.exports = router;