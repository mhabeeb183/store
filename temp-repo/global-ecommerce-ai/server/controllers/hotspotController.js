const Hotspot = require("../models/Hotspot");

// @desc    Get hotspots for a specific scene
// @route   GET /api/hotspots/:sceneId
// @access  Public
const getHotspotsByScene = async (req, res) => {
  try {
    const hotspots = await Hotspot.find({ sceneId: req.params.sceneId })
      .populate("productId", "name price dynamicPrice images description stock averageRating brand category")
      .populate("targetSceneId", "name panoramaUrl");
    res.status(200).json(hotspots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new hotspot
// @route   POST /api/hotspots
// @access  Private/Admin
const createHotspot = async (req, res) => {
  try {
    const { sceneId, productId, targetSceneId, pitch, yaw, type, label } = req.body;

    if (!sceneId || pitch === undefined || yaw === undefined || !type) {
      return res.status(400).json({ message: "Missing required hotspot fields" });
    }

    const hotspot = await Hotspot.create({
      sceneId,
      productId: productId || null,
      targetSceneId: targetSceneId || null,
      pitch,
      yaw,
      type,
      label: label || "",
    });

    // Populate references before returning
    const populatedHotspot = await Hotspot.findById(hotspot._id)
      .populate("productId", "name price dynamicPrice images description stock averageRating brand category")
      .populate("targetSceneId", "name panoramaUrl");

    res.status(201).json(populatedHotspot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update hotspot details
// @route   PUT /api/hotspots/:id
// @access  Private/Admin
const updateHotspot = async (req, res) => {
  try {
    const hotspot = await Hotspot.findById(req.params.id);
    if (!hotspot) {
      return res.status(404).json({ message: "Hotspot not found" });
    }

    const { productId, targetSceneId, pitch, yaw, type, label } = req.body;
    hotspot.productId = productId !== undefined ? (productId || null) : hotspot.productId;
    hotspot.targetSceneId = targetSceneId !== undefined ? (targetSceneId || null) : hotspot.targetSceneId;
    hotspot.pitch = pitch !== undefined ? pitch : hotspot.pitch;
    hotspot.yaw = yaw !== undefined ? yaw : hotspot.yaw;
    hotspot.type = type || hotspot.type;
    hotspot.label = label !== undefined ? label : hotspot.label;

    const updatedHotspot = await hotspot.save();
    
    const populatedHotspot = await Hotspot.findById(updatedHotspot._id)
      .populate("productId", "name price dynamicPrice images description stock averageRating brand category")
      .populate("targetSceneId", "name panoramaUrl");

    res.status(200).json(populatedHotspot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete hotspot
// @route   DELETE /api/hotspots/:id
// @access  Private/Admin
const deleteHotspot = async (req, res) => {
  try {
    const hotspot = await Hotspot.findById(req.params.id);
    if (!hotspot) {
      return res.status(404).json({ message: "Hotspot not found" });
    }

    await hotspot.deleteOne();
    res.status(200).json({ message: "Hotspot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHotspotsByScene,
  createHotspot,
  updateHotspot,
  deleteHotspot,
};
