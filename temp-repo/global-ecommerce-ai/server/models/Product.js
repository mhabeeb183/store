const mongoose = require("mongoose");

// REVIEW SCHEMA
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    name: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// PRODUCT SCHEMA
const productSchema = new mongoose.Schema(
  {
    // PRODUCT DETAILS
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      default: "",
    },

    // PRICING
    price: {
      type: Number,
      required: true,
      default: 0,
    },

    // ORIGINAL PRICE
    basePrice: {
      type: Number,
    },

    // CURRENT DYNAMIC PRICE
    dynamicPrice: {
      type: Number,
      default: 0,
    },

    // DYNAMIC PRICING SETTINGS
    dynamicPricingEnabled: {
      type: Boolean,
      default: true,
    },

    minPrice: {
      type: Number,
      default: 0,
    },

    maxPrice: {
      type: Number,
      default: 0,
    },

    // RULES APPLIED
    pricingRulesApplied: [
      {
        type: String,
      },
    ],

    customPricingAdjustment: {
  type: Number,
  default: 0,
},

    // INVENTORY
    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    // LOW STOCK ALERT
    lowStockThreshold: {
      type: Number,
      default: 10,
    },

    // WAREHOUSE
    warehouseLocation: {
      type: String,
      default: "Main Warehouse",
    },

    // SALES ANALYTICS
    soldCount: {
      type: Number,
      default: 0,
    },

    // IMAGES
    images: [
      {
        type: String,
      },
    ],

    // 3D/AR MODEL
    arModelUrl: {
      type: String,
      default: "",
    },

    // REVIEWS
    reviews: [reviewSchema],

    averageRating: {
      type: Number,
      default: 0,
    },

    numReviews: {
      type: Number,
      default: 0,
    },

    // PRODUCT OWNER
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", function () {
  if (!this.basePrice) {
    this.basePrice = this.price;
  }

  if (!this.dynamicPrice) {
    this.dynamicPrice = this.price;
  }

  if (!this.minPrice) {
    this.minPrice = this.price;
  }

  if (!this.maxPrice) {
    this.maxPrice = this.price * 2;
  }
});

const Product =
  mongoose.models.Product ||
  mongoose.model(
    "Product",
    productSchema
  );

module.exports = Product;