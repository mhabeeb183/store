import VendorEarning from "../models/vendorEarningModel.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Fetch vendor stats (total sales, earnings, available balance, list of earnings)
export const getVendorEarnings = async (req, res) => {
  try {
    const earnings = await VendorEarning.find({
      vendor: req.user.id,
    })
      .populate("order", "orderStatus createdAt totalAmount")
      .sort({ createdAt: -1 });

    const vendor = await User.findById(req.user.id);

    const totalSales = earnings.reduce(
      (acc, item) => acc + item.orderAmount,
      0
    );

    const totalEarnings = earnings
      .filter((item) => item.status === "credited")
      .reduce((acc, item) => acc + item.vendorAmount, 0);

    // Calculate Pending Earnings dynamically from undelivered orders
    const pendingOrders = await Order.find({
      orderStatus: { $in: ["Order Placed", "Processing", "Packed", "Shipped", "Out For Delivery"] }
    });

    // Find all products owned by this vendor
    const vendorProducts = await Product.find({ user: req.user.id });
    const vendorProductIds = vendorProducts.map((p) => p._id.toString());
    const vendorProductCustomIds = vendorProducts.map((p) => p.id); // target uses custom id

    let pendingEarnings = 0;

    for (const order of pendingOrders) {
      for (const item of order.items) {
        // Match items by product custom ID or ObjectId
        const matchesCustomId = vendorProductCustomIds.includes(item.id);
        const matchesObjectId = item.productId && vendorProductIds.includes(item.productId.toString());
        
        if (matchesCustomId || matchesObjectId) {
          // Parse item price
          const priceNum = typeof item.price === "number" 
            ? item.price 
            : parseFloat(item.price.replace("RS ", "").trim()) || 0;

          const qty = item.quantity || 1;
          const orderAmount = priceNum * qty;
          const commissionAmount = (orderAmount * 10) / 100; // 10% platform fee
          const vendorAmount = orderAmount - commissionAmount;

          pendingEarnings += vendorAmount;
        }
      }
    }

    const totalOrders = earnings.length;

    res.status(200).json({
      totalSales,
      totalOrders,
      totalEarnings,
      pendingEarnings,
      availableBalance: vendor.walletBalance || 0,
      earnings,
    });
  } catch (error) {
    console.error("Get Vendor Earnings Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};
