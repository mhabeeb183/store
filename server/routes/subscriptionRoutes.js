import express from "express";
import { createSubscriptionPlan, getSubscriptionPlans, createSubscriptionPurchase, activateWalletSubscription } from "../controllers/subscriptionController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route to view plans
router.get("/plans", getSubscriptionPlans);

// User protected routes
router.post("/purchase", UserAuth, createSubscriptionPurchase);
router.post("/activate-wallet", UserAuth, activateWalletSubscription);

// Admin protected route
router.post("/plans", UserAuth, createSubscriptionPlan);

export default router;
