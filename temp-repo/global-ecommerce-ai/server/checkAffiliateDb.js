require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const Product = require("./models/Product");
const User = require("./models/User");
const Affiliate = require("./models/affiliateModel");

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Fetch all affiliates
    const affiliates = await Affiliate.find({})
      .populate("affiliateUser", "name email walletBalance")
      .populate("referredUser", "name email walletBalance")
      .populate("product", "name price");

    console.log(`Found ${affiliates.length} affiliate records:\n`);
    for (const a of affiliates) {
      console.log(`Record ID: ${a._id}`);
      console.log(`Affiliate Code: ${a.affiliateCode}`);
      console.log(`Promoter (affiliateUser): ${a.affiliateUser?.name} (${a.affiliateUser?.email}) | Wallet Balance: ₹${a.affiliateUser?.walletBalance}`);
      console.log(`Buyer (referredUser): ${a.referredUser?.name} (${a.referredUser?.email}) | Wallet Balance: ₹${a.referredUser?.walletBalance}`);
      console.log(`Product: ${a.product?.name} (₹${a.product?.price})`);
      console.log(`Commission Earned: ₹${a.commissionEarned}`);
      console.log(`Payout Status: ${a.payoutStatus}`);
      console.log(`Is Converted: ${a.isConverted}`);
      console.log("-----------------------------------------");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error checking DB:", err);
  }
}

checkDb();
