 const express = require("express");

const {
  generateAffiliateLink,
  trackAffiliateClick,
  getAffiliateDashboard,
  getAffiliateEarnings,
  getAffiliateAnalytics,
  getTopAffiliates,
  approveAffiliatePayout,
} = require("../controllers/affiliateController");

const {
  protect,
  admin,
} = require("../middleware/authMiddleware");

const router = express.Router();

//
// CUSTOMER ROUTES
//
router.post(
  "/generate",
  protect,
  generateAffiliateLink
);

router.put(
  "/click/:code",
  trackAffiliateClick
);

router.get(
  "/dashboard",
  protect,
  getAffiliateDashboard
);

router.get(
  "/earnings",
  protect,
  getAffiliateEarnings
);

//
// ADMIN ROUTES
//
router.get(
  "/admin/analytics",
  protect,
  admin,
  getAffiliateAnalytics
);

router.get(
  "/admin/top-affiliates",
  protect,
  admin,
  getTopAffiliates
);

router.put(
  "/admin/payout/:id",
  protect,
  admin,
  approveAffiliatePayout
);

module.exports = router;