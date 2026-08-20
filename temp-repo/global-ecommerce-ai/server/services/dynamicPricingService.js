const Product = require("../models/Product");
const Order = require("../models/Order");
const mongoose = require("mongoose");

const getRecentSalesVolume = async (productId) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await Order.aggregate([
    {
      $match: {
        orderStatus: { $ne: "Cancelled" },
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    { $unwind: "$orderItems" },
    {
      $match: {
        "orderItems.product": new mongoose.Types.ObjectId(productId)
      }
    },
    {
      $group: {
        _id: null,
        totalQty: { $sum: "$orderItems.qty" }
      }
    }
  ]);
  return result.length > 0 ? result[0].totalQty : 0;
};


const calculateDynamicPrice = async (
  productId
) => {
  const product =
    await Product.findById(productId);

  if (!product) {
    throw new Error(
      "Product not found"
    );
  }

  if (
    !product.dynamicPricingEnabled
  ) {
    product.dynamicPrice =
      product.basePrice;

    product.pricingRulesApplied =
      [];

    await product.save();

    return product;
  }

  let finalPrice =
    product.basePrice;

  let appliedRules = [];

  // LOW STOCK
  if (
    product.stock <=
    product.lowStockThreshold
  ) {
    finalPrice +=
      product.basePrice * 0.05;

    appliedRules.push(
      "Low Stock (+5%)"
    );
  }

  // Fetch recent sales volume (last 7 days)
  const recentSales = await getRecentSalesVolume(productId);

  // VERY HIGH DEMAND
  if (
    recentSales > 100
  ) {
    finalPrice +=
      product.basePrice * 0.15;

    appliedRules.push(
      "Very High Demand (+15%)"
    );
  }

  // HIGH DEMAND
  else if (
    recentSales > 50
  ) {
    finalPrice +=
      product.basePrice * 0.10;

    appliedRules.push(
      "High Demand (+10%)"
    );
  }

  //
  // MIN PRICE LIMIT
  //
  if (
    product.minPrice > 0 &&
    finalPrice < product.minPrice
  ) {
    finalPrice =
      product.minPrice;

    appliedRules.push(
      "Min Price Limit"
    );
  }

  //
  // MAX PRICE LIMIT
  //
  if (
    product.maxPrice > 0 &&
    finalPrice > product.maxPrice
  ) {
    finalPrice =
      product.maxPrice;

    appliedRules.push(
      "Max Price Limit"
    );
  }
  // ADMIN CUSTOM RULE
if (product.customPricingAdjustment) {
  finalPrice +=
    product.basePrice *
    (product.customPricingAdjustment /
      100);

  appliedRules.push(
    `Admin Adjustment (${product.customPricingAdjustment}%)`
  );
}

  finalPrice =
    Math.round(finalPrice);

  product.dynamicPrice =
    finalPrice;

  product.pricingRulesApplied =
    appliedRules;

  await product.save();

  return product;
};

module.exports = {
  calculateDynamicPrice,
  getRecentSalesVolume,
};