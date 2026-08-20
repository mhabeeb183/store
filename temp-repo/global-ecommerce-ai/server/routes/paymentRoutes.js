const express = require("express");
const {
  createRazorpayOrder,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");
const fraudDetection = require("../middleware/fraudDetection");

const router = express.Router();

router.post(
  "/create-order",
  protect,
  fraudDetection,
  createRazorpayOrder
);

module.exports = router;