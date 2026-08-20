const Referral = require("../models/referralModel");
const User = require("../models/User");
const Wallet = require("../models/walletModel");

// =====================================
// Generate Referral Link
// =====================================
const generateReferralLink = async (
  req,
  res
) => {
  try {
    const referralCode =
      req.user._id
        .toString()
        .slice(-6) +
      Math.random()
        .toString(36)
        .substring(2, 8);

    const referral =
      await Referral.create({
        referrer: req.user._id,
        referralCode,
      });

    const referralLink =
      `${process.env.CLIENT_URL}/register?ref=${referralCode}`;

    res.status(201).json({
      success: true,
      referralCode,
      referralLink,
      referral,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// Track Referral Click
// =====================================
const trackReferralClick =
  async (req, res) => {
    try {
      const referral =
        await Referral.findOne({
          referralCode:
            req.params.code,
        });

      if (!referral) {
        return res
          .status(404)
          .json({
            message:
              "Referral not found",
          });
      }

      referral.clicks += 1;

      await referral.save();

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

// =====================================
// Reward Referral After Registration
// =====================================
const rewardReferral =
  async (req, res) => {
    try {
      const {
        referralCode,
        newUserId,
      } = req.body;

      const referral =
        await Referral.findOne({
          referralCode,
        });

      if (!referral) {
        return res
          .status(404)
          .json({
            message:
              "Referral not found",
          });
      }

      if (
        referral.rewardGiven
      ) {
        return res
          .status(400)
          .json({
            message:
              "Reward already given",
          });
      }

      referral.referredUser =
        newUserId;

      referral.registered = true;

      referral.rewardGiven = true;

      await referral.save();

      // Referrer Wallet
      const referrerWallet =
        await Wallet.findOne({
          user:
            referral.referrer,
        });

      referrerWallet.balance += 200;

      await referrerWallet.save();

      // New User Wallet
      const newUserWallet =
        await Wallet.findOne({
          user: newUserId,
        });

      newUserWallet.balance += 200;

      await newUserWallet.save();

      res.status(200).json({
        success: true,
        message:
          "₹200 credited to both users",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

// =====================================
// Referral Dashboard
// =====================================
const getReferralDashboard =
  async (req, res) => {
    try {
      const referrals =
        await Referral.find({
          referrer:
            req.user._id,
        }).populate(
          "referredUser",
          "name email"
        );

      const totalClicks =
        referrals.reduce(
          (acc, item) =>
            acc + item.clicks,
          0
        );

      const totalRewards =
        referrals.filter(
          (item) =>
            item.rewardGiven
        ).length * 200;

      res.status(200).json({
        success: true,
        referrals,
        totalClicks,
        totalRewards,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

// =====================================
// Admin Analytics
// =====================================
const getReferralAnalytics =
  async (req, res) => {
    try {
      const referrals =
        await Referral.find()
          .populate(
            "referrer",
            "name email"
          )
          .populate(
            "referredUser",
            "name email"
          );

      const totalClicks =
        referrals.reduce(
          (acc, item) =>
            acc + item.clicks,
          0
        );

      const totalRegistrations =
        referrals.filter(
          (item) =>
            item.registered
        ).length;

      const totalRewards =
        referrals.filter(
          (item) =>
            item.rewardGiven
        ).length * 400;

      res.status(200).json({
        success: true,
        totalClicks,
        totalRegistrations,
        totalRewards,
        referrals,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

module.exports = {
  generateReferralLink,
  trackReferralClick,
  rewardReferral,
  getReferralDashboard,
  getReferralAnalytics,
};