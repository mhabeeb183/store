const express = require("express");

const {
  chatbotSearch,
  getChatHistory,
} = require("../controllers/chatbotController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", chatbotSearch);
router.get("/history", protect, getChatHistory);

module.exports = router;