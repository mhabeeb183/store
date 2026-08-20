const Product = require("../models/Product");
const { cacheDelete, cacheInvalidatePattern } = require("../services/redisCacheService");

const updateCustomPricing =
  async (req, res) => {
    try {
      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      product.customPricingAdjustment =
        req.body.adjustment;
      product.dynamicPricingEnabled = true;

      const {
        calculateDynamicPrice,
      } = require(
        "../services/dynamicPricingService"
      );

      await product.save();
      await calculateDynamicPrice(product._id);

      // Invalidate caches to ensure UI shows fresh data
      await cacheInvalidatePattern("products:*");
      await cacheDelete(`product:${product._id}`);

      res.status(200).json({
        message:
          "Pricing rule updated",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

module.exports = {
  updateCustomPricing,
};