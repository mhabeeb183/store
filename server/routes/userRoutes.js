import express from "express";
import { registerUser, loginUser, updateUser, deleteUser, getUserProfile, googleLogin } from "../controllers/userController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);
router.get("/profile", UserAuth, getUserProfile);
router.post("/google-login", googleLogin);
router.get("/google-client-id", (req, res) => {
  res.status(200).json({ clientId: process.env.GOOGLE_CLIENT_ID || "" });
});

export default router;
