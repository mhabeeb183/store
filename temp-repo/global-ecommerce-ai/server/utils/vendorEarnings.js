const Product = require("../models/Product");
const User = require("../models/User");
const VendorEarning = require("../models/vendorEarningModel");
const Affiliate = require("../models/affiliateModel");

const processVendorEarnings = async (order) => {
  const COMMISSION_PERCENT = 10;

  for (const item of order.orderItems) {
    const product = await Product.findById(
      item.product
    );

    if (!product) continue;

    const vendorId = product.user;

    const orderAmount =
      item.price * item.qty;

    const commissionAmount =
      (orderAmount *
        COMMISSION_PERCENT) /
      100;

    // Check if this product was purchased via an affiliate link
    const affiliate = await Affiliate.findOne({
      order: order._id,
      product: product._id,
      isConverted: true
    });

    let affiliateCommission = 0;
    if (affiliate) {
      affiliateCommission = affiliate.commissionEarned || 0;

      // Automatically credit the promoter's wallet if the payout has not been processed yet
      if (affiliate.payoutStatus !== "Approved" && affiliate.payoutStatus !== "Paid") {
        const promoter = await User.findById(affiliate.affiliateUser);
        if (promoter) {
          promoter.walletBalance = (promoter.walletBalance || 0) + affiliateCommission;
          await promoter.save();
          console.log(`Auto-credited promoter "${promoter.name}" wallet with ₹${affiliateCommission} commission.`);

          // Deduct from Admin's wallet balance
          const admin = await User.findOne({ role: "admin" });
          if (admin) {
            admin.walletBalance = (admin.walletBalance || 0) - affiliateCommission;
            await admin.save();
            console.log(`Earning Payout: Deducted ₹${affiliateCommission} promoter commission from Admin "${admin.name}" wallet.`);
          }
        }
        affiliate.payoutStatus = "Approved";
        await affiliate.save();
      }
    }

    const vendorAmount =
      orderAmount -
      commissionAmount -
      affiliateCommission;

    // CREATE VENDOR EARNING RECORD
    await VendorEarning.create({
      vendor: vendorId,
      order: order._id,
      product: product._id,

      orderAmount,

      commissionPercent:
        COMMISSION_PERCENT,

      commissionAmount,

      vendorAmount,
      affiliateCommission,

      // ORDER IS DELIVERED
      // SO EARNINGS ARE CREDITED
      status: "credited",
    });

    // CREDIT VENDOR WALLET
    const vendor =
      await User.findById(vendorId);

    if (vendor) {
      vendor.walletBalance =
        (vendor.walletBalance ||
          0) + vendorAmount;

      await vendor.save();
      console.log(`Credited vendor "${vendor.name}" wallet with ₹${vendorAmount} (Deducted platform fee ₹${commissionAmount} and affiliate fee ₹${affiliateCommission}).`);

      // Deduct from Admin's wallet balance
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) - vendorAmount;
        await admin.save();
        console.log(`Earning Payout: Deducted ₹${vendorAmount} vendor earning from Admin "${admin.name}" wallet.`);
      }
    }
  }
};

module.exports = {
  processVendorEarnings,
};