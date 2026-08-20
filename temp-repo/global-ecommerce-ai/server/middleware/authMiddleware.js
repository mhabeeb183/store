const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Order = require("../models/Order");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = await User.findById(
        decoded.id
      ).select("-password");

      if (!req.user) {
        return res.status(401).json({
          message: "Not authorized, user not found",
        });
      }

      if (req.user.isBlocked) {
        return res.status(403).json({
          message: "Your account is suspended. Please contact support.",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "No token",
    });
  }
};

const admin = (req, res, next) => {
  if (
    req.user &&
    req.user.role === "admin"
  ) {
    next();
  } else {
    res.status(403).json({
      message: "Admin access only",
    });
  }
};
const vendor = (req, res, next) => {
  if (
    req.user &&
    req.user.role === "vendor"
  ) {
    next();
  } else {
    res.status(403).json({
      message: "Vendor access only",
    });
  }
};

const vendorOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Admins are always authorized
    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Admin or Vendor role required." });
    }

    // Fetch the order and populate product users
    const order = await Order.findById(req.params.id).populate({
      path: "orderItems.product",
      select: "user",
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the vendor owns any of the products in the order
    const ownsItem = order.orderItems.some((item) => {
      return item.product && item.product.user && item.product.user.toString() === req.user._id.toString();
    });

    if (!ownsItem) {
      return res.status(403).json({
        message: "Access denied. You do not own any products in this order.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  protect,
  admin,
  vendor,
  vendorOrAdmin,
};