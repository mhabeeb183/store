const express = require("express");
const {
  createVendorRequest,
  getVendorRequests,
  reviewVendorRequest,
} = require("../controllers/vendorRequestController");

const { protect } = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", protect, createVendorRequest);
router.get("/", protect, admin, getVendorRequests);
router.put("/:id", protect, admin, reviewVendorRequest);

module.exports = router;
