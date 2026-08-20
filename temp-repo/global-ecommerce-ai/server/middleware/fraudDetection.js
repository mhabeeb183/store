const FraudLog = require("../models/FraudLog");
const Order = require("../models/Order");

/**
 * Fraud Detection Middleware
 * Analyzes order patterns and flags suspicious activity
 */
const fraudDetection = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next();

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    let riskScore = 0;
    const flags = [];

    // 1. Rapid Orders Check (more than 5 orders in last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOrderCount = await Order.countDocuments({
      user: userId,
      createdAt: { $gte: tenMinutesAgo },
    });

    if (recentOrderCount >= 5) {
      riskScore += 30;
      flags.push({
        type: "rapid_orders",
        severity: "high",
        description: `${recentOrderCount} orders in last 10 minutes`,
        riskScore: 30,
      });
    } else if (recentOrderCount >= 3) {
      riskScore += 15;
      flags.push({
        type: "velocity_check",
        severity: "medium",
        description: `${recentOrderCount} orders in last 10 minutes`,
        riskScore: 15,
      });
    }

    // 2. High Value Order Check
    const orderAmount = req.body.totalPrice || req.body.amount || 0;
    if (orderAmount > 100000) {
      riskScore += 25;
      flags.push({
        type: "high_value_order",
        severity: "high",
        description: `High value order: ₹${orderAmount}`,
        riskScore: 25,
      });
    } else if (orderAmount > 50000) {
      riskScore += 10;
      flags.push({
        type: "high_value_order",
        severity: "medium",
        description: `Elevated value order: ₹${orderAmount}`,
        riskScore: 10,
      });
    }

    // 3. Multiple Failed Payments Check (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedPaymentFlags = await FraudLog.countDocuments({
      user: userId,
      type: "multiple_failed_payments",
      createdAt: { $gte: oneHourAgo },
    });

    if (failedPaymentFlags >= 3) {
      riskScore += 35;
      flags.push({
        type: "card_testing",
        severity: "critical",
        description: `${failedPaymentFlags} failed payment attempts in last hour`,
        riskScore: 35,
      });
    }

    // 4. Log flags to database
    if (flags.length > 0) {
      const fraudLogs = flags.map((flag) => ({
        user: userId,
        type: flag.type,
        severity: flag.severity,
        description: flag.description,
        riskScore: flag.riskScore,
        metadata: {
          ip,
          userAgent,
          amount: orderAmount,
        },
      }));

      await FraudLog.insertMany(fraudLogs);

      // Emit real-time fraud alert to admin
      const io = req.app.get("io");
      if (io) {
        io.emit("fraudAlert", {
          userId,
          riskScore,
          flags: flags.map((f) => f.type),
          timestamp: new Date(),
        });
      }
    }

    // 5. Block if risk score is critical
    if (riskScore >= 80) {
      return res.status(403).json({
        success: false,
        message: "Transaction blocked due to suspicious activity. Please contact support.",
        fraudDetected: true,
      });
    }

    // Attach risk score to request for downstream use
    req.riskScore = riskScore;
    req.fraudFlags = flags;

    next();
  } catch (error) {
    console.error("Fraud Detection Error:", error.message);
    // Don't block the request on detection errors
    next();
  }
};

module.exports = fraudDetection;
