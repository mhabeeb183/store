import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import UserAuth from "../middleware/authMiddleware.js";
import { VendorOrAdminAuth } from "../middleware/adminMiddleware.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", UserAuth, VendorOrAdminAuth, upload.single("image"), createProduct);
router.put("/:id", UserAuth, VendorOrAdminAuth, upload.single("image"), updateProduct);
router.delete("/:id", UserAuth, VendorOrAdminAuth, deleteProduct);

export default router;
