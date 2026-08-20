const VendorEarning = require("../models/vendorEarningModel");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Affiliate = require("../models/affiliateModel");

const getVendorEarnings = async (req, res) => {
  try {
    const earnings =
      await VendorEarning.find({
        vendor: req.user._id,
      }).sort({ createdAt: -1 });

    const vendor =
      await User.findById(req.user._id);

    const totalSales = earnings.reduce(
      (acc, item) =>
        acc + item.orderAmount,
      0
    );

    const totalEarnings = earnings
      .filter(
        (item) =>
          item.status === "credited"
      )
      .reduce(
        (acc, item) =>
          acc + item.vendorAmount,
        0
      );

    // Calculate Pending Earnings dynamically from active, undelivered orders
    const pendingOrders = await Order.find({
      orderStatus: { $in: ["Order Placed", "Packed", "Shipped", "Out For Delivery"] }
    }).populate("orderItems.product");

    let pendingEarnings = 0;

    for (const order of pendingOrders) {
      for (const item of order.orderItems) {
        if (item.product && item.product.user.toString() === req.user._id.toString()) {
          const orderAmount = item.price * item.qty;
          const commissionAmount = (orderAmount * 10) / 100;
          
          // Check if this product was purchased via an affiliate link
          const affiliate = await Affiliate.findOne({
            order: order._id,
            product: item.product._id,
            isConverted: true
          });
          
          const affiliateCommission = affiliate ? (affiliate.commissionEarned || 0) : 0;
          const vendorAmount = orderAmount - commissionAmount - affiliateCommission;
          
          pendingEarnings += vendorAmount;
        }
      }
    }

    const totalOrders =
      earnings.length;

    res.status(200).json({
      totalSales,
      totalOrders,
      totalEarnings,
      pendingEarnings,

      // NEW
      availableBalance:
        vendor.walletBalance,

      earnings,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getVendorEarnings,
};