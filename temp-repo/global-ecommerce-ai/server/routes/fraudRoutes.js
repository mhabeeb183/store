const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminMiddleware");

const {
  getAllFraudLogs,
  getFraudAnalytics,
  reviewFraudLog,
  reportFraud,
} = require("../controllers/fraudController");

router.get("/", protect, adminAuth, getAllFraudLogs);
router.get("/analytics", protect, adminAuth, getFraudAnalytics);
router.put("/:id/review", protect, adminAuth, reviewFraudLog);
router.post("/report", protect, reportFraud);

module.exports = router;
