const Affiliate = require("../models/affiliateModel");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");


// =====================================
// Generate Affiliate Link
// =====================================
const generateAffiliateLink = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const affiliateCode =
      req.user._id.toString().slice(-6) +
      Math.random().toString(36).substring(2, 8);

    const affiliate = await Affiliate.create({
      affiliateUser: req.user._id,
      referredUser: req.user._id,
      product: productId,
      affiliateCode,
    });

    const affiliateLink =
`http://localhost:5173/product/${productId}?ref=${affiliateCode}`;

    res.status(201).json({
      success: true,
      affiliateLink,
      affiliateCode,
      affiliate,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// =====================================
// Track Affiliate Click
// =====================================
const trackAffiliateClick = async (req, res) => {
  try {
    const { code } = req.params;

    const affiliate = await Affiliate.findOne({
      affiliateCode: code,
    });

    if (!affiliate) {
      return res.status(404).json({
        message: "Affiliate link not found",
      });
    }

    affiliate.clicks += 1;

    await affiliate.save();

    res.status(200).json({
      success: true,
      clicks: affiliate.clicks,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// =====================================
// Affiliate Dashboard
// =====================================
const getAffiliateDashboard = async (req, res) => {
  try {
    const affiliates = await Affiliate.find({
      affiliateUser: req.user._id,
    })
      .populate("product", "name price")
      .sort({ createdAt: -1 });

    const totalClicks = affiliates.reduce(
      (acc, item) => acc + item.clicks,
      0
    );

    const totalOrders = affiliates.filter(
      (item) => item.isConverted
    ).length;

    const totalCommission = affiliates.reduce(
      (acc, item) => acc + item.commissionEarned,
      0
    );

    res.status(200).json({
      success: true,
      affiliates,
      totalClicks,
      totalOrders,
      totalCommission,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// =====================================
// Affiliate Earnings
// =====================================
 const getAffiliateEarnings = async (req, res) => {
  try {
    const earnings = await Affiliate.find({
      affiliateUser: req.user._id,
      isConverted: true,
    }).populate("order");

    res.status(200).json({
      success: true,
      earnings,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// =====================================
// Admin Affiliate Analytics
// =====================================
 const getAffiliateAnalytics = async (req, res) => {
  try {
    const affiliates = await Affiliate.find()
      .populate("affiliateUser", "name email");

    const totalClicks = affiliates.reduce(
      (acc, item) => acc + item.clicks,
      0
    );

    const totalOrders = affiliates.filter(
      (item) => item.isConverted
    ).length;

    const totalRevenue = affiliates.reduce(
      (acc, item) => acc + item.orderAmount,
      0
    );

    const totalCommission = affiliates.reduce(
      (acc, item) => acc + item.commissionEarned,
      0
    );

    const conversionRate =
      totalClicks === 0
        ? 0
        : ((totalOrders / totalClicks) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      totalClicks,
      totalOrders,
      totalRevenue,
      totalCommission,
      conversionRate,
      affiliates,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// =====================================
// Top Affiliates
// =====================================
 const getTopAffiliates = async (req, res) => {
  try {
    const affiliates = await Affiliate.find({
      isConverted: true,
    })
      .populate("affiliateUser", "name email")
      .sort({ commissionEarned: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      affiliates,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// =====================================
// Approve Affiliate Payout
// =====================================
const approveAffiliatePayout = async (
  req,
  res
) => {
  try {
    const affiliate = await Affiliate.findById(
      req.params.id
    );

    if (!affiliate) {
      return res.status(404).json({
        message: "Affiliate not found",
      });
    }

    // Prevent double crediting the wallet
    if (affiliate.payoutStatus === "Approved" || affiliate.payoutStatus === "Paid") {
      return res.status(400).json({
        message: "Payout has already been approved or paid",
      });
    }

    // Credit the promoter's wallet balance
    const promoter = await User.findById(affiliate.affiliateUser);
    if (promoter) {
      promoter.walletBalance = (promoter.walletBalance || 0) + (affiliate.commissionEarned || 0);
      await promoter.save();
    }

    affiliate.payoutStatus = "Approved";
    await affiliate.save();

    res.status(200).json({
      success: true,
      message: "Payout approved and credited to wallet",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  generateAffiliateLink,
  trackAffiliateClick,
  getAffiliateDashboard,
  getAffiliateEarnings,
  getAffiliateAnalytics,
  getTopAffiliates,
  approveAffiliatePayout,
};