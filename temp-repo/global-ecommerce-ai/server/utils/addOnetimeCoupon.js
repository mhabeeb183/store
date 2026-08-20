require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const User = require("../models/User");
const Coupon = require("../models/couponModel");

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined.");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ MongoDB Connected successfully.");

    // Find John Doe
    let johnDoe = await User.findOne({ name: { $regex: /^john doe$/i } });
    if (!johnDoe) {
      console.log("⚠️ John Doe user not found by name, attempting fallback search by email...");
      johnDoe = await User.findOne({ email: "user@example.com" });
    }

    if (!johnDoe) {
      throw new Error("❌ John Doe account could not be found in the database.");
    }

    console.log(`👤 Found User: ${johnDoe.name} (${johnDoe.email}) - ID: ${johnDoe._id}`);

    // Check if the one-time coupon already exists
    const couponCode = "JOHNDOE50";
    const existingCoupon = await Coupon.findOne({ code: couponCode });

    if (existingCoupon) {
      console.log(`ℹ️ Coupon ${couponCode} already exists for user ID: ${existingCoupon.user}. Skipping creation.`);
      process.exit(0);
    }

    // Expiry in 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const coupon = await Coupon.create({
      code: couponCode,
      user: johnDoe._id,
      discountType: "percentage",
      discountValue: 50,
      minOrderAmount: 1000,
      expiryDate: expiryDate,
      reason: "One-time Special Coupon",
      isUsed: false,
    });

    console.log("🎉 Successfully created one-time use coupon for John Doe:");
    console.log(JSON.stringify(coupon, null, 2));

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding coupon:", error.message);
    process.exit(1);
  }
}

run();
