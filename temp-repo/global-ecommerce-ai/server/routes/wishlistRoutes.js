
const express = require("express");

const router = express.Router();

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require(
  "../controllers/wishlistController"
);

const {
  protect,
} = require("../middleware/authMiddleware");

// Add Product To Wishlist
router.post(
  "/:id",
  protect,
  addToWishlist
);

// Get User Wishlist
router.get(
  "/",
  protect,
  getWishlist
);

// Remove Product From Wishlist
router.delete(
  "/:id",
  protect,
  removeFromWishlist
);

module.exports = router;

