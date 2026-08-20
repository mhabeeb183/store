import express from "express";
import {
  getWishlist,
  getWishlistItemById,
  addToWishlist,
  updateWishlistItem,
  deleteWishlistItem,
} from "../controllers/wishlistController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware globally to all wishlist routes
router.use(UserAuth);

router.get("/", getWishlist);
router.get("/:id", getWishlistItemById);
router.post("/", addToWishlist);
router.put("/:id", updateWishlistItem);
router.delete("/:id", deleteWishlistItem);

export default router;
