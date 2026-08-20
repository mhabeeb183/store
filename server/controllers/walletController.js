import User from "../models/User.js";

// Fetch wallet balance and details
export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      walletBalance: user.walletBalance || 0,
      isSubscribed: user.isSubscribed || false,
      subscriptionExpiry: user.subscriptionExpiry || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add money to wallet balance
export const addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.walletBalance = (user.walletBalance || 0) + parsedAmount;
    await user.save();

    res.json({
      walletBalance: user.walletBalance,
      message: `Successfully loaded ₹${parsedAmount} to wallet.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Use wallet balance directly (debit transaction)
export const useWalletBalance = async (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if ((user.walletBalance || 0) < parsedAmount) {
      return res.status(400).json({
        message: "Insufficient wallet balance.",
      });
    }

    user.walletBalance -= parsedAmount;
    await user.save();

    // Credit platform/admin wallet with fee
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      admin.walletBalance = (admin.walletBalance || 0) + parsedAmount;
      await admin.save();
      console.log(`Platform Payment: Credited Admin "${admin.name}" wallet with ₹${parsedAmount}`);
    }

    res.json({
      walletBalance: user.walletBalance,
      message: `Used ₹${parsedAmount} from wallet.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
