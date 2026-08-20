
const express = require("express");

const router = express.Router();

const {
  getWallet,
  addMoney,
  useWalletBalance,
} = require(
  "../controllers/walletController"
);

const {
  protect,
} = require("../middleware/authMiddleware");

// Get Wallet Balance
router.get(
  "/",
  protect,
  getWallet
);

// Add Money To Wallet
router.post(
  "/add-money",
  protect,
  addMoney
);

// Deduct Wallet Balance
router.post(
  "/use-wallet",
  protect,
  useWalletBalance
);

module.exports = router;

