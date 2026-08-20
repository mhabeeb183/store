import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply UserAuth middleware to protect all order routes
router.use(UserAuth);

router.post("/createorder", createOrder);
router.get("/getorders", getOrders);
router.get("/getbyorderid/:id", getOrderById);
router.put("/updateorder/:id", updateOrder);
router.delete("/deleteorder/:id", deleteOrder);

export default router;
