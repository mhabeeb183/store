const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const { protect } = require("../middleware/authMiddleware");
const adminOrVendor = require("../middleware/adminMiddleware");

router.post("/", protect, adminOrVendor, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "products",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    res.status(200).json({
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/model", protect, adminOrVendor, upload.single("model"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "products/models",
          resource_type: "raw", // CRITICAL for non-image files like .glb
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    res.status(200).json({
      modelUrl: result.secure_url,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;