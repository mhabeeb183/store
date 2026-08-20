
const User = require("../models/User");

// Add Product To Wishlist
const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(
      req.user._id
    );

    if (
      !user.wishlist.includes(req.params.id)
    ) {
      user.wishlist.push(req.params.id);
      await user.save();
    }

    res.status(200).json(user.wishlist);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Wishlist
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(
      req.user._id
    ).populate("wishlist");

    res.status(200).json(user.wishlist);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Remove Product From Wishlist
const removeFromWishlist = async (
  req,
  res
) => {
  try {
    const user = await User.findById(
      req.user._id
    );

    user.wishlist = user.wishlist.filter(
      (item) =>
        item.toString() !== req.params.id
    );

    await user.save();

    res.status(200).json(user.wishlist);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};

