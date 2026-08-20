const Product = require("../models/Product");
const { cacheDelete, cacheInvalidatePattern } = require("../services/redisCacheService");

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      user: req.user._id,
    });

    const savedProduct = await product.save();

    // Invalidate product listings cache
    await cacheInvalidatePattern("products:*");

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    ).populate(
      "reviews.user",
      "name email"
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const updatedProduct =
      await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Invalidate cache
    await cacheInvalidatePattern("products:*");
    await cacheDelete(`product:/api/products/${req.params.id}`);

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await product.deleteOne();

    // Invalidate cache
    await cacheInvalidatePattern("products:*");
    await cacheDelete(`product:/api/products/${req.params.id}`);

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// CREATE PRODUCT REVIEW
const createProductReview = async (
req,
res
) => {
try {
const { rating, comment } = req.body;


const product = await Product.findById(
  req.params.id
);

if (!product) {
  return res.status(404).json({
    message: "Product not found",
  });
}

// CHECK IF USER ALREADY REVIEWED
const alreadyReviewed =
  product.reviews.find(
    (review) =>
      review.user.toString() ===
      req.user._id.toString()
  );

if (alreadyReviewed) {
  return res.status(400).json({
    message:
      "You have already reviewed this product",
  });
}

const review = {
  user: req.user._id,
  name: req.user.name,
  rating: Number(rating),
  comment,
};

product.reviews.push(review);

product.numReviews =
  product.reviews.length;

product.averageRating =
  product.reviews.reduce(
    (acc, item) =>
      item.rating + acc,
    0
  ) / product.reviews.length;

await product.save();

// Invalidate cache
await cacheInvalidatePattern("products:*");
await cacheDelete(`product:/api/products/${req.params.id}`);

res.status(201).json({
  message:
    "Review added successfully",
});


} catch (error) {
res.status(500).json({
message: error.message,
});
}
};

// GET ALL REVIEWS (ADMIN)
const getAllReviews = async (req, res) => {
try {
const products = await Product.find(
{},
"name reviews averageRating numReviews"
);


const reviews = [];

products.forEach((product) => {
  product.reviews.forEach((review) => {
    reviews.push({
      productId: product._id,
      productName: product.name,

      reviewId: review._id,
      user: review.user,

      name: review.name,
      rating: review.rating,
      comment: review.comment,

      createdAt: review.createdAt,
    });
  });
});

res.status(200).json(reviews);


} catch (error) {
res.status(500).json({
message: error.message,
});
}
};

const getLowStockProducts = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find();

    const lowStockProducts =
      products.filter(
        (product) =>
          product.stock <=
          product.lowStockThreshold
      );

    res.status(200).json(
      lowStockProducts
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET VENDOR REVIEWS
const getVendorReviews = async (req, res) => {
  try {
    const products = await Product.find(
      { user: req.user._id },
      "name reviews averageRating numReviews"
    );

    const reviews = [];

    products.forEach((product) => {
      product.reviews.forEach((review) => {
        reviews.push({
          productId: product._id,
          productName: product.name,
          reviewId: review._id,
          user: review.user,
          name: review.name,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        });
      });
    });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// GET VENDOR PRODUCTS
const getVendorProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getLowStockProducts,
  updateProduct,
  deleteProduct,
  createProductReview,
  getAllReviews,
  getVendorReviews,
  getVendorProducts,
};

