const VendorRequest = require("../models/VendorRequest");
const User = require("../models/User");

// Create request
const createVendorRequest = async (req, res) => {
  try {
    const { businessName, description } = req.body;

    const existingRequest = await VendorRequest.findOne({
      user: req.user._id,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have a pending request",
      });
    }

    const request = await VendorRequest.create({
      user: req.user._id,
      businessName,
      description,
    });

    res.status(201).json({
      message: "Vendor request submitted successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get all requests (admin only)
const getVendorRequests = async (req, res) => {
  try {
    const requests = await VendorRequest.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Review request (admin only)
const reviewVendorRequest = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const { id } = req.params;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const request = await VendorRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        message: "Vendor request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Request already reviewed",
      });
    }

    request.status = status;
    request.reviewNotes = reviewNotes || "";
    await request.save();

    if (status === "approved") {
      await User.findByIdAndUpdate(request.user, { role: "vendor" });
    }

    res.status(200).json({
      message: `Vendor request ${status} successfully`,
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createVendorRequest,
  getVendorRequests,
  reviewVendorRequest,
};
