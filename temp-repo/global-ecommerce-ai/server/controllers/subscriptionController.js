
const SubscriptionPlan = require("../models/SubscriptionPlan");

const User = require("../models/User");
const razorpay = require("../config/razorpay");
const UserSubscription = require(
  "../models/UserSubscription"
);



/*
=================================================
CREATE SUBSCRIPTION PLAN
POST /api/subscriptions/plans
Admin Only
=================================================
*/
const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, duration, price, freeDelivery } = req.body;

    if (!name || !duration || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, duration and price are required",
      });
    }

    const existingPlan = await SubscriptionPlan.findOne({
      name: name.trim(),
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: "Subscription plan already exists",
      });
    }

    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      duration,
      price,
      freeDelivery:
        freeDelivery !== undefined ? freeDelivery : true,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create Subscription Plan Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const activateWalletSubscription = async (
  req,
  res
) => {
  try {
    const { planId } = req.body;

    const user = await User.findById(
      req.user._id
    );

    const plan =
      await SubscriptionPlan.findById(
        planId
      );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (
      user.walletBalance < plan.price
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Insufficient wallet balance",
      });
    }

    user.walletBalance -= plan.price;

    const expiryDate = new Date();

    expiryDate.setDate(
      expiryDate.getDate() +
        plan.duration
    );

    const subscription =
      await UserSubscription.create({
        user: user._id,
        plan: plan._id,
        expiryDate,
        status: "active",
        amountPaid: plan.price,
      });

    user.isSubscribed = true;
    user.subscriptionExpiry =
      expiryDate;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Subscription Activated",
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/*
=================================================
GET ALL SUBSCRIPTION PLANS
GET /api/subscriptions/plans
Public
=================================================
*/
const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({
      isActive: true,
    }).sort({ price: 1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Get Subscription Plans Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


const createSubscriptionPurchase = async (req, res) => {
  try {
    const { planId, useWallet = false } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    let planAmount = plan.price;
    let walletUsed = 0;
    let remainingAmount = planAmount;

    // Wallet + Razorpay
    if (useWallet && user.walletBalance > 0) {
      walletUsed = Math.min(
        user.walletBalance,
        planAmount
      );

      remainingAmount =
        planAmount - walletUsed;
    }

    // Wallet Only
    if (remainingAmount === 0) {
      return res.status(200).json({
        success: true,
        paymentType: "wallet",
        walletUsed,
        amountToPay: 0,
        plan,
        message:
          "Subscription can be activated directly",
      });
    }

    // Razorpay Order
    const razorpayOrder =
      await razorpay.orders.create({
        amount: remainingAmount * 100,
        currency: "INR",
        receipt: `subscription_${Date.now()}`,
      });

    res.status(200).json({
      success: true,
      paymentType:
        walletUsed > 0
          ? "wallet+razorpay"
          : "razorpay",
      walletUsed,
      amountToPay: remainingAmount,
      razorpayOrder,
      plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = {
  createSubscriptionPlan,
  getSubscriptionPlans,
  createSubscriptionPurchase,
  activateWalletSubscription,
};

