import VendorRequest from "../models/VendorRequest.js";
import User from "../models/User.js";

// Create request to become a vendor
export const createVendorRequest = async (req, res) => {
  try {
    const { businessName, description } = req.body;

    if (!businessName || !description) {
      return res.status(400).json({ message: "Business name and description are required." });
    }

    const existingRequest = await VendorRequest.findOne({
      user: req.user.id,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have a pending request.",
      });
    }

    const request = await VendorRequest.create({
      user: req.user.id,
      businessName,
      description,
    });

    res.status(201).json({
      message: "Vendor request submitted successfully.",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get all vendor requests (admin only)
export const getVendorRequests = async (req, res) => {
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

// Review request (approve / reject) (admin only)
export const reviewVendorRequest = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const { id } = req.params;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status selection. Must be approved or rejected.",
      });
    }

    const request = await VendorRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        message: "Vendor request not found.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Request has already been reviewed.",
      });
    }

    request.status = status;
    request.reviewNotes = reviewNotes || "";
    await request.save();

    if (status === "approved") {
      await User.findByIdAndUpdate(request.user, { role: "vendor" });
    }

    res.status(200).json({
      message: `Vendor request was ${status} successfully.`,
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
