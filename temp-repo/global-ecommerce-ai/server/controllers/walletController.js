
const User = require("../models/User");

// Get Wallet Balance
const getWallet = async (req, res) => {
  try {
    const user = await User.findById(
      req.user._id
    );

    res.json({
      walletBalance: user.walletBalance,
      isSubscribed: user.isSubscribed,
      subscriptionExpiry: user.subscriptionExpiry,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add Money
const addMoney = async (req, res) => {
  try {
    const { amount } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    const user = await User.findById(
      req.user._id
    );

    user.walletBalance += parsedAmount;

    await user.save();

    res.json({
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Use Wallet Balance
const useWalletBalance = async (
  req,
  res
) => {
  try {
    const { amount } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    const user = await User.findById(
      req.user._id
    );

    if (
      user.walletBalance < parsedAmount
    ) {
      return res.status(400).json({
        message:
          "Insufficient wallet balance",
      });
    }

    user.walletBalance -= parsedAmount;
    await user.save();

    // Credit Admin Wallet
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      admin.walletBalance = (admin.walletBalance || 0) + parsedAmount;
      await admin.save();
      console.log(`Wallet Payment: Credited Admin "${admin.name}" wallet with ₹${parsedAmount}`);
    }

    res.json({
      walletBalance: user.walletBalance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getWallet,
  addMoney,
  useWalletBalance,
};

