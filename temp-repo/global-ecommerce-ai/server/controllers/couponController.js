const Coupon = require("../models/couponModel");

// =====================================
// CREATE COUPON
// =====================================
const createCoupon = async (
  req,
  res
) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      expiryDate,
      userId,
      reason,
    } = req.body;

    const coupon =
      await Coupon.create({
        code,
        user: userId,
        discountType,
        discountValue,
        minOrderAmount,
        expiryDate,
        reason,
      });

    res.status(201).json(
      coupon
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// GET MY COUPONS
// =====================================
const getMyCoupons =
  async (req, res) => {
    try {
      const coupons =
        await Coupon.find({
          user: req.user._id,
        }).sort({
          createdAt: -1,
        });

      res.json(coupons);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

// =====================================
// VALIDATE COUPON
// =====================================
const validateCoupon =
  async (req, res) => {
    try {
      const {
        code,
        orderAmount,
      } = req.body;

      const coupon =
        await Coupon.findOne({
          code,
        });

      if (!coupon) {
        return res
          .status(404)
          .json({
            message:
              "Invalid Coupon",
          });
      }

      if (coupon.isUsed) {
        return res
          .status(400)
          .json({
            message:
              "Coupon Already Used",
          });
      }

      if (
        new Date() >
        coupon.expiryDate
      ) {
        return res
          .status(400)
          .json({
            message:
              "Coupon Expired",
          });
      }

      if (
        orderAmount <
        coupon.minOrderAmount
      ) {
        return res
          .status(400)
          .json({
            message: `Minimum order amount ₹${coupon.minOrderAmount}`,
          });
      }

      let discount = 0;

      if (
        coupon.discountType ===
        "fixed"
      ) {
        discount =
          coupon.discountValue;
      } else {
        discount =
          (orderAmount *
            coupon.discountValue) /
          100;
      }

      res.json({
        valid: true,
        discount,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

// =====================================
// MARK USED
// =====================================
const markCouponUsed =
  async (couponCode) => {
    const coupon =
      await Coupon.findOne({
        code: couponCode,
      });

    if (!coupon) return;

    coupon.isUsed = true;

    coupon.usedAt =
      new Date();

    await coupon.save();
  };

// =====================================
// GET ALL COUPONS (ADMIN)
// =====================================
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).populate("user", "name email").sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// DELETE COUPON (ADMIN)
// =====================================
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found",
      });
    }
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createCoupon,
  getMyCoupons,
  validateCoupon,
  markCouponUsed,
  getAllCoupons,
  deleteCoupon,
};