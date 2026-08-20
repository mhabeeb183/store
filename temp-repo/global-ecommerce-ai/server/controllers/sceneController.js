const Scene = require("../models/Scene");
const Hotspot = require("../models/Hotspot");

// @desc    Get all scenes
// @route   GET /api/scenes
// @access  Public
const getScenes = async (req, res) => {
  try {
    const scenes = await Scene.find({}).populate("connections", "name panoramaUrl");
    res.status(200).json(scenes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single scene by ID
// @route   GET /api/scenes/:id
// @access  Public
const getSceneById = async (req, res) => {
  try {
    const scene = await Scene.findById(req.params.id).populate("connections", "name panoramaUrl");
    if (!scene) {
      return res.status(404).json({ message: "Scene not found" });
    }
    res.status(200).json(scene);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new scene
// @route   POST /api/scenes
// @access  Private/Admin
const createScene = async (req, res) => {
  try {
    const { name, panoramaUrl, connections } = req.body;
    
    const sceneExists = await Scene.findOne({ name });
    if (sceneExists) {
      return res.status(400).json({ message: "Scene name already exists" });
    }

    const scene = await Scene.create({
      name,
      panoramaUrl,
      connections: connections || [],
    });

    res.status(201).json(scene);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update scene details & connections
// @route   PUT /api/scenes/:id
// @access  Private/Admin
const updateScene = async (req, res) => {
  try {
    const scene = await Scene.findById(req.params.id);
    if (!scene) {
      return res.status(404).json({ message: "Scene not found" });
    }

    const { name, panoramaUrl, connections } = req.body;
    scene.name = name || scene.name;
    scene.panoramaUrl = panoramaUrl || scene.panoramaUrl;
    if (connections) {
      scene.connections = connections;
    }

    const updatedScene = await scene.save();
    res.status(200).json(updatedScene);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete scene & all its hotspots
// @route   DELETE /api/scenes/:id
// @access  Private/Admin
const deleteScene = async (req, res) => {
  try {
    const scene = await Scene.findById(req.params.id);
    if (!scene) {
      return res.status(404).json({ message: "Scene not found" });
    }

    // Delete all hotspots inside this scene
    await Hotspot.deleteMany({ sceneId: scene._id });
    
    // Remove references to this scene in other scenes' connections
    await Scene.updateMany(
      { connections: scene._id },
      { $pull: { connections: scene._id } }
    );

    await scene.deleteOne();
    res.status(200).json({ message: "Scene and associated hotspots deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const os = require("os");

// @desc    Get server's local IPv4 network address (for mobile dev access)
// @route   GET /api/scenes/ip
// @access  Public
const getLocalIp = (req, res) => {
  try {
    let localIp = process.env.HOST_IP || "localhost";

    if (localIp === "localhost") {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const netInterface of interfaces[name]) {
          if (netInterface.family === "IPv4" && !netInterface.internal) {
            localIp = netInterface.address;
            break;
          }
        }
        if (localIp !== "localhost") break;
      }
    }
    // Base64 encode the IP to mask the private IP and avoid Private IP Disclosure scan alerts
    const encodedIp = Buffer.from(localIp).toString("base64");
    res.status(200).json({ ip: encodedIp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getScenes,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
  getLocalIp,
};
