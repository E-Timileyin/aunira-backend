import type { OrderStatusValue } from "@/modules/order/order.model";
import { AdminRepository } from "./admin.repository";

export class AdminService {
	static instance: AdminService;

	private repository: AdminRepository;

	static getInstance(): AdminService {
		if (!this.instance) {
			this.instance = new AdminService();
		}
		return this.instance;
	}

	/** @private - use AdminService.getInstance() */
	private constructor() {
		this.repository = new AdminRepository();
	}

	getUsers() {
		return this.repository.getAdminUsers();
	}

	getOrders(options: { status?: string; page?: number; limit?: number }) {
		return this.repository.getOrdersAdmin(options);
	}

	async updateOrderStatus(id: string, status: string) {
		const updated = await this.repository.updateOrderStatus(id, status as OrderStatusValue);
		if (!updated) {
			// Original behavior: a missing order id surfaces as the generic
			// ORDER_UPDATE_ERROR 500, not a 404.
			throw new Error("Failed to update order status");
		}
		return updated;
	}

	getStats() {
		return this.repository.getStats();
	}
}