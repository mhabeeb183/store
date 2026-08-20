const express = require("express");

const router = express.Router();

const {
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getDeliveredProductsForWithdrawal,
} = require("../controllers/withdrawalController");

const {
  protect,
} = require("../middleware/authMiddleware");

// VENDOR ROUTES
router.post(
  "/request",
  protect,
  requestWithdrawal
);

router.get(
  "/delivered-products",
  protect,
  getDeliveredProductsForWithdrawal
);

router.get(
  "/my",
  protect,
  getMyWithdrawals
);

// ADMIN ROUTES
router.get(
  "/all",
  protect,
  getAllWithdrawals
);

router.put(
  "/approve/:id",
  protect,
  approveWithdrawal
);

router.put(
  "/reject/:id",
  protect,
  rejectWithdrawal
);

module.exports = router;