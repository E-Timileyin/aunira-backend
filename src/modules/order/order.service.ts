import { eq } from "drizzle-orm";
import { getDb } from "@/db/postgres.db";
import { ApiError } from "@/helpers";
import { CartRepository } from "@/modules/cart/cart.repository";
import { cartItems } from "@/modules/cart/cart.model";
import { OrderStatus } from "./order.model";
import { OrderRepository } from "./order.repository";

const ORDER_STATUSES = OrderStatus.enumValues;

export class OrderService {
	static instance: OrderService;

	private repository: OrderRepository;
	private cartRepository: CartRepository;

	static getInstance(): OrderService {
		if (!this.instance) {
			this.instance = new OrderService();
		}
		return this.instance;
	}

	/** @private - use OrderService.getInstance() */
	private constructor() {
		this.repository = new OrderRepository();
		this.cartRepository = new CartRepository();
	}

	/** Creates an order from the user's cart, then clears the cart. */
	async createOrder(userId: string) {
		const cart = await this.cartRepository.findCartByUserId(userId);
		const cartContents = cart ? await this.cartRepository.getCartWithItems(cart.id) : null;

		if (!cartContents || cartContents.items.length === 0) {
			throw new ApiError(400, "Cart is empty", "CART_EMPTY");
		}

		const items = cartContents.items.map((item) => ({
			productId: item.productId,
			quantity: item.quantity,
			price: item.price,
		}));

		const order = await this.repository.createWithItems({ userId, total: cartContents.total, items });

		// Cart is consumed by the order.
		await this.clearCartItems(cartContents.id);

		const full = await this.repository.findById(order.id);
		if (!full) {
			throw new ApiError(400, "Failed to create order", "ORDER_CREATE_ERROR");
		}
		return full;
	}

	getUserOrders(userId: string) {
		return this.repository.findByUserId(userId);
	}

	async getOrderById(id: string, userId: string) {
		const order = await this.repository.findByIdForUser(id, userId);
		if (!order) {
			throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
		}
		return order;
	}

	async cancelOrder(id: string, userId: string) {
		const order = await this.repository.findByIdForUser(id, userId);
		if (!order) {
			throw new ApiError(400, "Order not found", "ORDER_NOT_FOUND");
		}

		if (order.status === "COMPLETED") {
			throw new ApiError(400, "Cannot cancel a completed order", "ORDER_CANCEL_ERROR");
		}

		const updated = await this.repository.updateStatus(id, "CANCELLED");
		if (!updated) {
			throw new ApiError(400, "Failed to cancel order", "ORDER_CANCEL_ERROR");
		}

		return this.repository.findById(id);
	}

	async updateOrderStatus(id: string, status: string) {
		if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
			throw new ApiError(400, "Invalid order status", "ORDER_STATUS_UPDATE_ERROR");
		}

		const updated = await this.repository.updateStatus(id, status as (typeof ORDER_STATUSES)[number]);
		if (!updated) {
			throw new ApiError(400, "Order not found", "ORDER_STATUS_UPDATE_ERROR");
		}

		return this.repository.findById(id);
	}

	getAllOrders() {
		return this.repository.findAll();
	}

	/** Deletes every line of the given cart (no cart row itself — kept for history). */
	private async clearCartItems(cartId: string) {
		const db = getDb();
		await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
	}
}