import Product from "../models/Product.js";
import User from "../models/User.js";
import VendorEarning from "../models/vendorEarningModel.js";

export const processVendorEarnings = async (order) => {
  const COMMISSION_PERCENT = 10;

  for (const item of order.items) {
    // Find product matching item.id (custom ID) or item.productId (ObjectId)
    let product = null;
    if (item.productId) {
      product = await Product.findById(item.productId);
    } else {
      product = await Product.findOne({ id: item.id });
    }

    if (!product) continue;

    const vendorId = product.user;
    if (!vendorId) continue; // skip admin owned/unknown products

    // Parse price
    const priceNum = typeof item.price === "number" 
      ? item.price 
      : parseFloat(item.price.replace("RS ", "").trim()) || 0;

    const orderAmount = priceNum * (item.quantity || 1);
    const commissionAmount = (orderAmount * COMMISSION_PERCENT) / 100;
    const vendorAmount = orderAmount - commissionAmount;

    // Create Vendor Earning Log
    await VendorEarning.create({
      vendor: vendorId,
      order: order._id,
      product: product._id,
      orderAmount,
      commissionPercent: COMMISSION_PERCENT,
      commissionAmount,
      vendorAmount,
      status: "credited",
    });

    // Credit Vendor Wallet Balance
    const vendor = await User.findById(vendorId);
    if (vendor) {
      vendor.walletBalance = (vendor.walletBalance || 0) + vendorAmount;
      await vendor.save();
      console.log(`Credited vendor "${vendor.name}" wallet with ₹${vendorAmount} (Deducted platform fee ₹${commissionAmount}).`);
      
      // Deduct from Admin's wallet balance
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) - vendorAmount;
        await admin.save();
      }
    }
  }
};
