const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createLiveStream,
  getActiveStreams,
  getStreamById,
  startStream,
  endStream,
  joinStream,
  sendStreamChat,
  getMyStreams,
  startLiveAuction,
  placeLiveBid,
  checkoutLiveAuction,
  addProductToLiveStream,
  getIceServers,
} = require("../controllers/liveStreamController");

router.post("/", protect, createLiveStream);
router.get("/active", getActiveStreams);
router.get("/my-streams", protect, getMyStreams);
router.get("/ice-servers", protect, getIceServers);
router.get("/:id", getStreamById);
router.put("/:id/start", protect, startStream);
router.put("/:id/end", protect, endStream);
router.post("/:id/join", protect, joinStream);
router.post("/:id/chat", protect, sendStreamChat);

// Live Stream Auction Routes
router.post("/:id/auction/start", protect, startLiveAuction);
router.post("/:id/auction/bid", protect, placeLiveBid);
router.post("/:id/auction/checkout", protect, checkoutLiveAuction);
router.post("/:id/products", protect, addProductToLiveStream);

module.exports = router;
