import type { Request, Response } from "express";
import { logger } from "@/utils";
import { AdminService } from "./admin.service";

export class AdminController {
	static instance: AdminController;

	private service: AdminService;

	static getInstance(): AdminController {
		if (!this.instance) {
			this.instance = new AdminController();
		}
		return this.instance;
	}

	/** @private - use AdminController.getInstance() */
	private constructor() {
		this.service = AdminService.getInstance();
	}

	getUsers = async (req: Request, res: Response) => {
		try {
			const users = await this.service.getUsers();
			res.json({ status: "success", data: { users } });
		} catch (error) {
			logger.error(
				`Error fetching users: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(500).json({
				status: "error",
				message: "Failed to fetch users",
				code: "USERS_FETCH_ERROR",
			});
		}
	};

	getOrders = async (req: Request, res: Response) => {
		try {
			const orders = await this.service.getOrders({
				status:
					typeof req.query.status === "string"
						? req.query.status
						: undefined,
				page: Number.isFinite(Number(req.query.page))
					? Math.max(1, Math.floor(Number(req.query.page)))
					: 1,
				limit: Number.isFinite(Number(req.query.limit))
					? Math.max(1, Math.floor(Number(req.query.limit)))
					: 50,
			});
			res.json({ status: "success", data: orders });
		} catch (error) {
			logger.error(
				`Error fetching orders: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(500).json({
				status: "error",
				message: "Failed to fetch orders",
				code: "ORDERS_FETCH_ERROR",
			});
		}
	};

	updateOrderStatus = async (req: Request<{ id: string }>, res: Response) => {
		try {
			const { status } = req.body;

			if (!status) {
				return res.status(400).json({
					status: "error",
					message: "Status is required",
					code: "VALIDATION_ERROR",
				});
			}

			const order = await this.service.updateOrderStatus(
				String(req.params.id),
				status,
			);
			res.json({ status: "success", data: { order } });
		} catch (error) {
			logger.error(
				`Error updating order status: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(500).json({
				status: "error",
				message: "Failed to update order status",
				code: "ORDER_UPDATE_ERROR",
			});
		}
	};

	// Admin dashboard stats
	getStats = async (req: Request, res: Response) => {
		try {
			const stats = await this.service.getStats();
			res.json({ status: "success", data: { stats } });
		} catch (error) {
			logger.error(
				`Admin dashboard error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(500).json({
				status: "error",
				message: "Failed to fetch dashboard data",
				code: "DASHBOARD_ERROR",
			});
		}
	};
}
