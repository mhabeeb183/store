import SubscriptionPlan from "../models/SubscriptionPlan.js";
import UserSubscription from "../models/UserSubscription.js";
import User from "../models/User.js";
import razorpay from "../config/razorpay.js";

// Create subscription plan (admin only)
export const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, duration, price, freeDelivery } = req.body;

    if (!name || !duration || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, duration and price are required.",
      });
    }

    const existingPlan = await SubscriptionPlan.findOne({
      name: name.trim(),
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: "Subscription plan already exists.",
      });
    }

    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      duration,
      price,
      freeDelivery: freeDelivery !== undefined ? freeDelivery : true,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully.",
      plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch active subscription plans (public)
export const getSubscriptionPlans = async (req, res) => {
  try {
    let plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });

    // Seed default plans if collection is empty
    if (plans.length === 0) {
      plans = await SubscriptionPlan.insertMany([
        { name: "Monthly Gold", duration: 30, price: 199, freeDelivery: true },
        { name: "Quarterly Platinum", duration: 90, price: 499, freeDelivery: true },
        { name: "Annual Diamond", duration: 365, price: 1499, freeDelivery: true }
      ]);
    }

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Purchase plan (integrates wallet deduction and/or Razorpay mock options)
export const createSubscriptionPurchase = async (req, res) => {
  try {
    const { planId, useWallet = false } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Subscription plan not found" });
    }

    let planAmount = plan.price;
    let walletUsed = 0;
    let remainingAmount = planAmount;

    // Calculate Wallet contribution
    if (useWallet && user.walletBalance > 0) {
      walletUsed = Math.min(user.walletBalance, planAmount);
      remainingAmount = planAmount - walletUsed;
    }

    // Fully paid by wallet
    if (remainingAmount === 0) {
      return res.status(200).json({
        success: true,
        paymentType: "wallet",
        walletUsed,
        amountToPay: 0,
        plan,
        message: "Subscription can be activated directly using wallet balance.",
      });
    }

    // Otherwise initiate Razorpay order (or generate a mock order if keys are not set)
    let razorpayOrder = null;
    
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: remainingAmount * 100, // in paise
          currency: "INR",
          receipt: `sub_${Date.now()}`,
        });
      } catch (err) {
        console.error("Razorpay Order Creation Error:", err.message);
      }
    }

    // Mock Razorpay order if Razorpay is not configured (for development ease)
    if (!razorpayOrder) {
      razorpayOrder = {
        id: `mock_order_${Math.random().toString(36).substring(2, 10)}`,
        amount: remainingAmount * 100,
        currency: "INR",
        receipt: `sub_${Date.now()}`,
      };
    }

    res.status(200).json({
      success: true,
      paymentType: walletUsed > 0 ? "wallet+razorpay" : "razorpay",
      walletUsed,
      amountToPay: remainingAmount,
      razorpayOrder,
      plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Activate subscription (called on success)
export const activateWalletSubscription = async (req, res) => {
  try {
    const { planId, walletUsed = 0 } = req.body;

    const user = await User.findById(req.user.id);
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({ success: false, message: "Subscription plan not found" });
    }

    // Deduct wallet balance if user opted in
    if (walletUsed > 0) {
      if (user.walletBalance < walletUsed) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      }
      user.walletBalance -= walletUsed;
      
      // Credit Admin wallet with the payment
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) + walletUsed;
        await admin.save();
      }
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration);

    const subscription = await UserSubscription.create({
      user: user._id,
      plan: plan._id,
      expiryDate,
      status: "active",
      amountPaid: plan.price,
    });

    user.isSubscribed = true;
    user.subscriptionExpiry = expiryDate;
    user.subscription = subscription._id;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully!",
      subscription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
