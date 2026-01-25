import express from "express";
import { authenticateToken, requireAdmin } from "@/middlewares/auth";
import { AuthController } from "./auth.controller";

const router = express.Router();

const authController = AuthController.getInstance();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

router.get("/profile", authenticateToken, authController.getProfile);
router.get(
	"/admin/dashboard",
	authenticateToken,
	requireAdmin,
	authController.adminDashboard,
);

export { router as authRouter };
