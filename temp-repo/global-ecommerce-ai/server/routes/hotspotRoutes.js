const express = require("express");
const {
  getHotspotsByScene,
  createHotspot,
  updateHotspot,
  deleteHotspot,
} = require("../controllers/hotspotController");

const { protect } = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

router.route("/")
  .post(protect, admin, createHotspot);

router.route("/scene/:sceneId")
  .get(getHotspotsByScene);

router.route("/:id")
  .put(protect, admin, updateHotspot)
  .delete(protect, admin, deleteHotspot);

module.exports = router;
