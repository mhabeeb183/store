const Product = require("../models/Product");
const { getRecentSalesVolume } = require("../services/dynamicPricingService");

const getVendorDynamicPricing = async (
  req,
  res
) => {
  try {
    const products = await Product.find({
      user: req.user._id,
    });

    const pricingData = await Promise.all(
      products.map(
        async (product) => {
          const recentSales = await getRecentSalesVolume(product._id);
          let demandStatus = "Normal";

          if (recentSales > 100) {
            demandStatus =
              "Very High Demand";
          } else if (
            recentSales > 50
          ) {
            demandStatus =
              "High Demand";
          }

          let stockStatus = "Healthy";

          if (product.stock === 0) {
            stockStatus =
              "Out Of Stock";
          } else if (
            product.stock <=
            product.lowStockThreshold
          ) {
            stockStatus = "Low Stock";
          }

          return {
            _id: product._id,

            name: product.name,

            // PRICING
            basePrice:
              product.basePrice ||
              product.price,

            dynamicPrice:
              product.dynamicPrice ||
              product.price,

            currentPrice:
              product.dynamicPrice ||
              product.price,

            // VENDOR CONTROLS
            dynamicPricingEnabled:
              product.dynamicPricingEnabled,

            minPrice:
              product.minPrice,

            maxPrice:
              product.maxPrice,

            // INVENTORY
            stock: product.stock,

            soldCount: recentSales,

            stockStatus,

            demandStatus,

            // RULES
            pricingRulesApplied:
              product.pricingRulesApplied ||
              [],
          };
        }
      )
    );

    res.status(200).json(
      pricingData
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getVendorDynamicPricing,
};