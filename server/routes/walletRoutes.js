import express from "express";
import { getWallet, addMoney, useWalletBalance } from "../controllers/walletController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(UserAuth);

router.get("/", getWallet);
router.post("/add", addMoney);
router.post("/use-wallet", useWalletBalance);

export default router;
