import express from "express";
import { AdminController } from "./admin.controller";

const router = express.Router();

const adminController = AdminController.getInstance();

router.get("/stats", adminController.getStats);

router.get("/users", adminController.getUsers);

export { router as dashboardRouter };
