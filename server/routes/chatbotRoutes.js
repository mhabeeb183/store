import express from "express";
import { chatbotSearch, getChatHistory } from "../controllers/chatbotController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", chatbotSearch);
router.get("/history", UserAuth, getChatHistory);

export default router;
