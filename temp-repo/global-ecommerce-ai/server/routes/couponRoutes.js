const express = require("express");
const {
  createCoupon,
  getMyCoupons,
  validateCoupon,
  getAllCoupons,
  deleteCoupon,
} = require(
  "../controllers/couponController"
);

const {
  protect,
  admin,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

//
// USER ROUTES
//
router.get(
  "/my",
  protect,
  getMyCoupons
);

router.post(
  "/validate",
  protect,
  validateCoupon
);

//
// ADMIN ROUTES
//
router.post(
  "/",
  protect,
  admin,
  createCoupon
);

router.get(
  "/",
  protect,
  admin,
  getAllCoupons
);

router.delete(
  "/:id",
  protect,
  admin,
  deleteCoupon
);

module.exports = router;