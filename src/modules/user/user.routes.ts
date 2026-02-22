import express from "express";
import { authenticateToken } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validate";
import { UserController } from "./user.controller";
import { changePasswordSchema, updateProfileSchema } from "./user.schema";

const router = express.Router();

const userController = UserController.getInstance();

// Authentication required for all user routes
router.use(authenticateToken);

// Admin only - user management
router.get("/admin/users", (req, res, next) => {
	if (req.user?.role !== "ADMIN") {
		return res.status(403).json({
			error: "Forbidden: Admin access required",
			code: "ADMIN_ACCESS_REQUIRED",
		});
	}
	next();
}, userController.getAllUsers);

// User profile routes
router.get("/me", userController.getCurrentUserProfile);

router.patch("/me", validateBody(updateProfileSchema), userController.updateUserProfile);

// Change password
router.post("/change-password", validateBody(changePasswordSchema), userController.changePassword);

// Admin only - single user management
router
	.route("/:id")
	.get((req, res, next) => {
		if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.id) {
			return res.status(403).json({
				error: "Forbidden: Access denied",
				code: "FORBIDDEN",
			});
		}
		next();
	}, userController.getUserById)
	.delete((req, res, next) => {
		if (req.user?.role !== "ADMIN") {
			return res.status(403).json({
				error: "Forbidden: Admin access required",
				code: "ADMIN_ACCESS_REQUIRED",
			});
		}
		next();
	}, userController.deleteUser);

export { router as userRouter };