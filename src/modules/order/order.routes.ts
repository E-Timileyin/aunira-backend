import express from "express";
import { authenticateToken } from "@/middlewares/auth";
import { OrderController } from "./order.controller";

const router = express.Router();

const orderController = OrderController.getInstance();

router.use(authenticateToken);

router.post("/create", orderController.createOrder);

router.get("/", orderController.getUserOrders);

router.get("/admin/all", orderController.getAllOrders);

router.get("/:id", orderController.getOrderById);

router.put("/:id/cancel", orderController.cancelOrder);

router.put("/:id/status", orderController.updateOrderStatus);

export default router;
