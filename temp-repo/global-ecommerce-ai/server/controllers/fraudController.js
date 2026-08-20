const FraudLog = require("../models/FraudLog");
const Order = require("../models/Order");
const User = require("../models/User");

// Get all fraud logs (admin)
const getAllFraudLogs = async (req, res) => {
  try {
    const { status, severity, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const fraudLogs = await FraudLog.find(query)
      .populate("user", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FraudLog.countDocuments(query);

    res.json({ success: true, fraudLogs, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get fraud analytics (admin)
const getFraudAnalytics = async (req, res) => {
  try {
    const totalFlags = await FraudLog.countDocuments();
    const pending = await FraudLog.countDocuments({ status: "pending" });
    const reviewed = await FraudLog.countDocuments({ status: "reviewed" });
    const resolved = await FraudLog.countDocuments({ status: "resolved" });
    const falsePositives = await FraudLog.countDocuments({ status: "false_positive" });

    const bySeverity = await FraudLog.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byType = await FraudLog.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentFlags = await FraudLog.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    const avgRiskScore = await FraudLog.aggregate([
      { $group: { _id: null, avg: { $avg: "$riskScore" } } },
    ]);

    res.json({
      success: true,
      analytics: {
        totalFlags,
        pending,
        reviewed,
        resolved,
        falsePositives,
        averageRiskScore: avgRiskScore[0]?.avg?.toFixed(2) || 0,
        bySeverity,
        byType,
        recentFlags,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Review a fraud flag (admin)
const reviewFraudLog = async (req, res) => {
  try {
    const { status, actionTaken, reviewNotes } = req.body;

    const fraudLog = await FraudLog.findByIdAndUpdate(
      req.params.id,
      {
        status,
        actionTaken: actionTaken || "none",
        reviewNotes,
        reviewedBy: req.user._id,
      },
      { new: true }
    ).populate("user", "name email");

    if (!fraudLog) {
      return res.status(404).json({ success: false, message: "Fraud log not found" });
    }

    // If action is account_suspended, update user
    if (actionTaken === "account_suspended") {
      await User.findByIdAndUpdate(fraudLog.user._id, { isBlocked: true });

      // Emit real-time notification to the user's specific room
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${fraudLog.user._id}`).emit("accountSuspended", {
          message: "Your account has been suspended by administration.",
        });
      }
    }

    res.json({ success: true, fraudLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manual fraud report
const reportFraud = async (req, res) => {
  try {
    const fraudLog = await FraudLog.create({
      ...req.body,
      riskScore: req.body.riskScore || 50,
    });

    res.status(201).json({ success: true, fraudLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllFraudLogs,
  getFraudAnalytics,
  reviewFraudLog,
  reportFraud,
};
