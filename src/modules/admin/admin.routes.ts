import express from "express";
import { authenticateToken, requireAdmin } from "@/middlewares/auth";
import { AdminController } from "./admin.controller";
import { dashboardRouter } from "./dashboard.routes";

const router = express.Router();

const adminController = AdminController.getInstance();

// Authentication + admin check for every admin route, including the
// dashboard sub-router (same 403 shape the dashboard routes used inline).
router.use(authenticateToken, requireAdmin);

router.use("/dashboard", dashboardRouter);

router.get("/users", adminController.getUsers);

router.get("/orders", adminController.getOrders);

router.patch("/orders/:id/status", adminController.updateOrderStatus);

export { router as adminRouter };
