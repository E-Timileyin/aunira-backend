import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/postgres.db";
import {
	orderItems,
	orders,
	type OrderStatusValue,
} from "@/modules/order/order.model";
import { products } from "@/modules/product/product.model";
import { users } from "@/modules/user/user.model";
import { UserRepository } from "@/modules/user/user.repository";

/** Admin-facing user projection (the golden select — no missing columns). */
const adminUserColumns = {
	id: users.id,
	name: users.name,
	email: users.email,
	role: users.role,
	isEmailVerified: users.isEmailVerified,
	lastLoginAt: users.lastLoginAt,
	createdAt: users.createdAt,
};

export class AdminRepository {
	private userRepository: UserRepository;

	constructor() {
		this.userRepository = new UserRepository();
	}

	async getAdminUsers() {
		const db = getDb();
		return db
			.select(adminUserColumns)
			.from(users)
			.orderBy(desc(users.createdAt));
	}

	async getOrdersAdmin(options: {
		status?: string;
		page?: number;
		limit?: number;
	}) {
		const db = getDb();
		const page = Math.max(1, options.page ?? 1);
		const limit = Math.max(1, options.limit ?? 50);

		const where = options.status
			? and(eq(orders.status, options.status as OrderStatusValue))
			: undefined;

		const [rows, totalRow] = await Promise.all([
			db
				.select({
					orderId: orders.id,
					userId: orders.userId,
					total: orders.total,
					status: orders.status,
					createdAt: orders.createdAt,
					updatedAt: orders.updatedAt,
					userEmail: users.email,
					itemId: orderItems.id,
					itemQuantity: orderItems.quantity,
					itemPrice: orderItems.price,
					productId: products.id,
					productName: products.name,
					productPrice: products.price,
				})
				.from(orders)
				.innerJoin(users, eq(orders.userId, users.id))
				.leftJoin(orderItems, eq(orders.id, orderItems.orderId))
				.leftJoin(products, eq(orderItems.productId, products.id))
				.where(where)
				.orderBy(desc(orders.createdAt))
				.limit(limit)
				.offset((page - 1) * limit),
			db.select({ value: count() }).from(orders).where(where),
		]);

		const grouped = new Map<
			string,
			{
				id: string;
				userId: string;
				total: number;
				status: OrderStatusValue;
				createdAt: Date;
				updatedAt: Date;
				user: { id: string; email: string };
				items: {
					id: string;
					quantity: number;
					price: number;
					productId: string | null;
					product: { id: string; name: string; price: number } | null;
				}[];
			}
		>();

		for (const row of rows) {
			if (!grouped.has(row.orderId)) {
				grouped.set(row.orderId, {
					id: row.orderId,
					userId: row.userId,
					total: row.total,
					status: row.status,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
					user: { id: row.userId, email: row.userEmail },
					items: [],
				});
			}
			if (row.itemId) {
				grouped.get(row.orderId)!.items.push({
					id: row.itemId,
					quantity: row.itemQuantity!,
					price: row.itemPrice!,
					productId: row.productId,
					product: row.productId
						? {
								id: row.productId,
								name: row.productName!,
								price: row.productPrice!,
							}
						: null,
				});
			}
		}

		const orderList = [...grouped.values()];
		const total = totalRow[0]?.value ?? 0;

		return {
			orders: orderList,
			pagination: {
				total,
				page,
				totalPages: Math.ceil(total / limit),
				limit,
			},
		};
	}

	/** Returns a single order with its user summary, or null when missing. */
	async getOrderWithUser(id: string) {
		const db = getDb();
		const [row] = await db
			.select({
				id: orders.id,
				userId: orders.userId,
				total: orders.total,
				status: orders.status,
				createdAt: orders.createdAt,
				updatedAt: orders.updatedAt,
				userEmail: users.email,
			})
			.from(orders)
			.innerJoin(users, eq(orders.userId, users.id))
			.where(eq(orders.id, id));

		if (!row) {
			return null;
		}

		return {
			id: row.id,
			userId: row.userId,
			total: row.total,
			status: row.status,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			user: { id: row.userId, email: row.userEmail },
		};
	}

	async updateOrderStatus(id: string, status: OrderStatusValue) {
		const db = getDb();
		const [updated] = await db
			.update(orders)
			.set({ status, updatedAt: new Date() })
			.where(eq(orders.id, id))
			.returning();
		if (!updated) {
			return null;
		}
		return this.getOrderWithUser(id);
	}

	async getStats() {
		return this.userRepository.getCounts();
	}
}
