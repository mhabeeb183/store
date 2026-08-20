import express from "express";
import {
  getCart,
  getCartItemById,
  addToCart,
  updateCartItem,
  deleteCartItem,
} from "../controllers/cartController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(UserAuth);

router.get("/", getCart);
router.get("/:id", getCartItemById);
router.post("/", addToCart);
router.put("/:id", updateCartItem);
router.delete("/:id", deleteCartItem);

export default router;
