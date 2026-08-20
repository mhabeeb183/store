require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const Affiliate = require("./models/affiliateModel");
const User = require("./models/User");
const Order = require("./models/Order");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database.");

    // Find the pending affiliate record
    const affiliate = await Affiliate.findOne({ affiliateCode: "bf3d2c9eomc8" });
    if (!affiliate) {
      console.error("Affiliate record for bf3d2c9eomc8 not found.");
      process.exit(1);
    }

    // Find the latest order placed by the referred user (mohamed)
    const order = await Order.findOne({ user: affiliate.referredUser }).sort({ createdAt: -1 });
    if (!order) {
      console.error("No order found for the referred user.");
      process.exit(1);
    }

    console.log(`Found order ID: ${order._id} with total price: ₹${order.totalPrice}`);

    // If it's already converted, tell us
    if (affiliate.isConverted) {
      console.log("Affiliate transaction is already marked as converted.");
    } else {
      // 1. Mark as converted and calculate commission
      affiliate.order = order._id;
      affiliate.orderAmount = order.totalPrice;
      affiliate.commissionEarned = (order.totalPrice * affiliate.commissionRate) / 100;
      affiliate.isConverted = true;
      affiliate.convertedAt = order.createdAt;
      console.log(`Updated Affiliate commissionEarned to ₹${affiliate.commissionEarned}`);
    }

    // 2. Approve the payout and credit the promoter's wallet
    if (affiliate.payoutStatus === "Approved" || affiliate.payoutStatus === "Paid") {
      console.log("Payout has already been approved/paid.");
    } else {
      affiliate.payoutStatus = "Approved";

      const promoter = await User.findById(affiliate.affiliateUser);
      if (promoter) {
        const oldBalance = promoter.walletBalance || 0;
        promoter.walletBalance = oldBalance + affiliate.commissionEarned;
        await promoter.save();
        console.log(`Credited promoter "${promoter.name}" (${promoter.email}) wallet: ₹${oldBalance} -> ₹${promoter.walletBalance}`);
      } else {
        console.error("Promoter user not found.");
      }
    }

    await affiliate.save();
    console.log("Saved affiliate record successfully.");

    await mongoose.disconnect();
    console.log("Database connection closed.");
  } catch (err) {
    console.error("Error during migration:", err);
  }
}

run();
