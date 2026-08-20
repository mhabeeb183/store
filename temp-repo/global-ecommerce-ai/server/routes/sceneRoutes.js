const express = require("express");
const {
  getScenes,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
  getLocalIp,
} = require("../controllers/sceneController");

const { protect } = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

router.route("/")
  .get(getScenes)
  .post(protect, admin, createScene);

router.route("/ip")
  .get(getLocalIp);

router.route("/:id")
  .get(getSceneById)
  .put(protect, admin, updateScene)
  .delete(protect, admin, deleteScene);

module.exports = router;
