const express = require("express");

const router = express.Router();

const {
  getVendorEarnings,
} = require("../controllers/vendorEarningController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.get(
  "/dashboard",
  protect,
  getVendorEarnings
);

module.exports = router;