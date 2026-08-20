import express from "express";
import { createVendorRequest, getVendorRequests, reviewVendorRequest } from "../controllers/vendorRequestController.js";
import { getVendorEarnings } from "../controllers/vendorEarningController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(UserAuth);

// Vendor onboarding endpoints
router.post("/request", createVendorRequest);
router.get("/requests", getVendorRequests);
router.put("/request/:id", reviewVendorRequest);

// Vendor earnings endpoint
router.get("/earnings", getVendorEarnings);

export default router;
