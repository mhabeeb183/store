const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const VendorEarning = require("../models/vendorEarningModel");

// VENDOR - REQUEST WITHDRAWAL
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, vendorEarningId } = req.body;

    const vendor = await User.findById(req.user._id);

    let withdrawalAmount = Number(amount);
    let earning = null;

    if (vendorEarningId) {
      earning = await VendorEarning.findById(vendorEarningId);
      if (!earning) {
        return res.status(404).json({ message: "Earning record not found" });
      }
      if (earning.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Unauthorized access to earning record" });
      }

      // Check if a withdrawal was already requested for this specific product sale
      const existingWithdrawal = await Withdrawal.findOne({ vendorEarning: vendorEarningId });
      if (existingWithdrawal) {
        return res.status(400).json({ message: "Withdrawal already requested for this product sale" });
      }

      withdrawalAmount = earning.vendorAmount;
    }

    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({
        message: "Withdrawal amount must be a positive number",
      });
    }

    if (!vendor || vendor.walletBalance < withdrawalAmount) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
      });
    }

    // Deduct immediately from vendor's wallet balance to reserve funds
    vendor.walletBalance -= withdrawalAmount;
    await vendor.save();

    const withdrawal = await Withdrawal.create({
      vendor: req.user._id,
      amount: withdrawalAmount,
      vendorEarning: vendorEarningId || null,
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// VENDOR - MY WITHDRAWALS
const getMyWithdrawals = async (
  req,
  res
) => {
  try {
    const withdrawals =
      await Withdrawal.find({
        vendor: req.user._id,
      }).sort({
        createdAt: -1,
      });

    res.status(200).json(
      withdrawals
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADMIN - GET ALL WITHDRAWALS
const getAllWithdrawals = async (
  req,
  res
) => {
  try {
    const withdrawals =
      await Withdrawal.find()
        .populate(
          "vendor",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json(
      withdrawals
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADMIN - APPROVE WITHDRAWAL
const approveWithdrawal = async (
  req,
  res
) => {
  try {
    const withdrawal =
      await Withdrawal.findById(
        req.params.id
      );

    if (!withdrawal) {
      return res.status(404).json({
        message:
          "Withdrawal not found",
      });
    }

    if (
      withdrawal.status !==
      "Pending"
    ) {
      return res.status(400).json({
        message:
          "Already processed",
      });
    }

    const admin = await User.findById(req.user._id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin role required.",
      });
    }

    if (admin.walletBalance < withdrawal.amount) {
      return res.status(400).json({
        message: "Insufficient admin wallet balance",
      });
    }

    const vendor = await User.findById(withdrawal.vendor);
    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    admin.walletBalance -= withdrawal.amount;
    await admin.save();

    withdrawal.status =
      "Approved";

    await withdrawal.save();

    res.status(200).json({
      message:
        "Withdrawal approved successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADMIN - REJECT WITHDRAWAL
const rejectWithdrawal = async (
  req,
  res
) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "Pending") {
      return res.status(400).json({
        message: "Withdrawal already processed",
      });
    }

    // Refund the vendor's wallet balance
    const vendor = await User.findById(withdrawal.vendor);
    if (vendor) {
      vendor.walletBalance = (vendor.walletBalance || 0) + withdrawal.amount;
      await vendor.save();
    }

    withdrawal.status = "Rejected";
    await withdrawal.save();

    res.status(200).json({
      message:
        "Withdrawal rejected successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getDeliveredProductsForWithdrawal = async (req, res) => {
  try {
    const earnings = await VendorEarning.find({ vendor: req.user._id })
      .populate("product")
      .populate("order")
      .sort({ createdAt: -1 });

    const withdrawals = await Withdrawal.find({ vendor: req.user._id });

    // Map vendorEarning ID to withdrawal status
    const withdrawalMap = {};
    withdrawals.forEach((w) => {
      if (w.vendorEarning) {
        withdrawalMap[w.vendorEarning.toString()] = w.status;
      }
    });

    const items = earnings.map((earning) => {
      let name = "Past Product Sale";
      let image = "";

      if (earning.product) {
        name = earning.product.name;
        image = earning.product.image;
      } else if (earning.order && earning.order.orderItems) {
        // Fallback: search in order items
        const vendorItem = earning.order.orderItems.find(
          (item) => item.price * item.qty === earning.orderAmount
        );
        if (vendorItem) {
          name = vendorItem.name;
          image = vendorItem.image;
        }
      }

      return {
        earningId: earning._id,
        orderId: earning.order?._id,
        productName: name,
        productImage: image,
        orderAmount: earning.orderAmount,
        vendorAmount: earning.vendorAmount,
        date: earning.createdAt,
        withdrawalStatus: withdrawalMap[earning._id.toString()] || "Available",
      };
    });

    res.status(200).json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getDeliveredProductsForWithdrawal,
};