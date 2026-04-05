import type { Request, Response } from "express";
import { ApiError } from "@/helpers";
import { logger } from "@/utils";
import { OrderService } from "./order.service";

export class OrderController {
	static instance: OrderController;

	private service: OrderService;

	static getInstance(): OrderController {
		if (!this.instance) {
			this.instance = new OrderController();
		}
		return this.instance;
	}

	/** @private - use OrderController.getInstance() */
	private constructor() {
		this.service = OrderService.getInstance();
	}

	createOrder = async (req: Request, res: Response) => {
		try {
			const order = await this.service.createOrder(req.user!.id);
			res.status(201).json(order);
		} catch (error) {
			res.status(400).json({
				status: "error",
				message: error instanceof Error ? error.message : "Failed to create order",
				code: "ORDER_CREATE_ERROR",
			});
		}
	};

	getUserOrders = async (req: Request, res: Response) => {
		try {
			const orders = await this.service.getUserOrders(req.user!.id);
			res.json(orders);
		} catch (error) {
			logger.error(`Error getting user orders: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json({
				status: "error",
				message: "Failed to get orders",
				code: "ORDERS_GET_ERROR",
			});
		}
	};

	getOrderById = async (req: Request<{ id: string }>, res: Response) => {
		try {
			const order = await this.service.getOrderById(req.params.id, req.user!.id);
			res.json(order);
		} catch (error) {
			res.status(404).json({
				status: "error",
				message: error instanceof Error ? error.message : "Order not found",
				code: "ORDER_NOT_FOUND",
			});
		}
	};

	cancelOrder = async (req: Request<{ id: string }>, res: Response) => {
		try {
			const order = await this.service.cancelOrder(req.params.id, req.user!.id);
			res.json(order);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to cancel order";
			const code = error instanceof ApiError && error.code ? error.code : "ORDER_CANCEL_ERROR";
			res.status(400).json({ status: "error", message, code });
		}
	};

	updateOrderStatus = async (req: Request<{ id: string }>, res: Response) => {
		try {
			if (req.user!.role !== "ADMIN") {
				return res.status(403).json({
					status: "error",
					message: "Admin access required",
					code: "ADMIN_REQUIRED",
				});
			}

			const order = await this.service.updateOrderStatus(req.params.id, req.body.status);
			res.json(order);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to update order status";
			const code = error instanceof ApiError && error.code ? error.code : "ORDER_STATUS_UPDATE_ERROR";
			res.status(400).json({ status: "error", message, code });
		}
	};

	getAllOrders = async (req: Request, res: Response) => {
		try {
			if (req.user!.role !== "ADMIN") {
				return res.status(403).json({
					status: "error",
					message: "Admin access required",
					code: "ADMIN_REQUIRED",
				});
			}

			const orders = await this.service.getAllOrders();
			res.json(orders);
		} catch (error) {
			logger.error(`Error getting all orders: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json({
				status: "error",
				message: "Failed to get all orders",
				code: "ORDERS_ADMIN_GET_ERROR",
			});
		}
	};
}