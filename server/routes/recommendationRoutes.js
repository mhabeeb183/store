import express from "express";
import { getRecommendations, getPersonalizedRecommendations, trackRecommendationClick } from "../controllers/recommendationController.js";
import { getAnalytics } from "../controllers/recommendationAnalyticsController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Public recommendation endpoint (captures user ID inside controller header validation)
router.get("/product/:id", getRecommendations);

// Click tracking
router.post("/click", trackRecommendationClick);

// Protected endpoints
router.get("/personalized", UserAuth, getPersonalizedRecommendations);

// Admin recommendation analytics endpoint
router.get("/analytics", UserAuth, getAnalytics);

export default router;
