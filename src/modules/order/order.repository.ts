import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/db/postgres.db";
import { products } from "@/modules/product/product.model";
import { orderItems, orders, type OrderStatusValue } from "./order.model";

export interface OrderLine {
	id: string;
	productId: string;
	quantity: number;
	price: number;
	product: { id: string; name: string; price: number; image_url: string | null } | null;
}

export interface OrderWithItems {
	id: string;
	userId: string;
	total: number;
	status: OrderStatusValue;
	createdAt: Date;
	updatedAt: Date;
	items: OrderLine[];
}

const mapRows = (rows: {
	orderId: string;
	userId: string;
	total: number;
	status: OrderStatusValue;
	orderCreatedAt: Date;
	orderUpdatedAt: Date;
	itemId: string | null;
	productId: string | null;
	quantity: number | null;
	price: number | null;
	productName: string | null;
	productPrice: number | null;
	productImage: string | null;
}[]): OrderWithItems[] => {
	const grouped = new Map<string, OrderWithItems>();

	for (const row of rows) {
		if (!grouped.has(row.orderId)) {
			grouped.set(row.orderId, {
				id: row.orderId,
				userId: row.userId,
				total: row.total,
				status: row.status,
				createdAt: row.orderCreatedAt,
				updatedAt: row.orderUpdatedAt,
				items: [],
			});
		}

		if (row.itemId) {
			grouped.get(row.orderId)!.items.push({
				id: row.itemId,
				productId: row.productId!,
				quantity: row.quantity!,
				price: row.price!,
				product: row.productId
					? { id: row.productId, name: row.productName!, price: row.productPrice!, image_url: row.productImage }
					: null,
			});
		}
	}

	return [...grouped.values()];
};

export class OrderRepository {
	/** Creates an order and its items in a single transaction. */
	async createWithItems(data: { userId: string; total: number; items: { productId: string; quantity: number; price: number }[] }) {
		const db = getDb();
		const now = new Date();

		return db.transaction(async (tx) => {
			const orderId = randomUUID();
			const [order] = await tx
				.insert(orders)
				.values({
					id: orderId,
					userId: data.userId,
					total: data.total,
					status: "PENDING",
					createdAt: now,
					updatedAt: now,
				})
				.returning();

			if (data.items.length > 0) {
				await tx.insert(orderItems).values(
					data.items.map((item) => ({
						id: randomUUID(),
						orderId,
						productId: item.productId,
						quantity: item.quantity,
						price: item.price,
						createdAt: now,
						updatedAt: now,
					})),
				);
			}

			if (!order) {
				throw new Error("Order insert returned no row");
			}

			return order;
		});
	}

	async findByUserId(userId: string): Promise<OrderWithItems[]> {
		const db = getDb();
		const rows = await db
			.select({
				orderId: orders.id,
				userId: orders.userId,
				total: orders.total,
				status: orders.status,
				orderCreatedAt: orders.createdAt,
				orderUpdatedAt: orders.updatedAt,
				itemId: orderItems.id,
				productId: orderItems.productId,
				quantity: orderItems.quantity,
				price: orderItems.price,
				productName: products.name,
				productPrice: products.price,
				productImage: products.image_url,
			})
			.from(orders)
			.leftJoin(orderItems, eq(orders.id, orderItems.orderId))
			.leftJoin(products, eq(orderItems.productId, products.id))
			.where(eq(orders.userId, userId))
			.orderBy(desc(orders.createdAt));

		return mapRows(rows);
	}

	async findByIdForUser(id: string, userId: string): Promise<OrderWithItems | null> {
		const db = getDb();
		const rows = await db
			.select({
				orderId: orders.id,
				userId: orders.userId,
				total: orders.total,
				status: orders.status,
				orderCreatedAt: orders.createdAt,
				orderUpdatedAt: orders.updatedAt,
				itemId: orderItems.id,
				productId: orderItems.productId,
				quantity: orderItems.quantity,
				price: orderItems.price,
				productName: products.name,
				productPrice: products.price,
				productImage: products.image_url,
			})
			.from(orders)
			.leftJoin(orderItems, eq(orders.id, orderItems.orderId))
			.leftJoin(products, eq(orderItems.productId, products.id))
			.where(eq(orders.id, id))
			.limit(1);

		const order = mapRows(rows).find((o) => o.id === id);
		if (!order || order.userId !== userId) {
			return null;
		}
		return order;
	}

	async findById(id: string): Promise<OrderWithItems | null> {
		const db = getDb();
		const rows = await db
			.select({
				orderId: orders.id,
				userId: orders.userId,
				total: orders.total,
				status: orders.status,
				orderCreatedAt: orders.createdAt,
				orderUpdatedAt: orders.updatedAt,
				itemId: orderItems.id,
				productId: orderItems.productId,
				quantity: orderItems.quantity,
				price: orderItems.price,
				productName: products.name,
				productPrice: products.price,
				productImage: products.image_url,
			})
			.from(orders)
			.leftJoin(orderItems, eq(orders.id, orderItems.orderId))
			.leftJoin(products, eq(orderItems.productId, products.id))
			.where(eq(orders.id, id));

		return mapRows(rows)[0] ?? null;
	}

	async findAll(): Promise<OrderWithItems[]> {
		const db = getDb();
		const rows = await db
			.select({
				orderId: orders.id,
				userId: orders.userId,
				total: orders.total,
				status: orders.status,
				orderCreatedAt: orders.createdAt,
				orderUpdatedAt: orders.updatedAt,
				itemId: orderItems.id,
				productId: orderItems.productId,
				quantity: orderItems.quantity,
				price: orderItems.price,
				productName: products.name,
				productPrice: products.price,
				productImage: products.image_url,
			})
			.from(orders)
			.leftJoin(orderItems, eq(orders.id, orderItems.orderId))
			.leftJoin(products, eq(orderItems.productId, products.id))
			.orderBy(desc(orders.createdAt));

		return mapRows(rows);
	}

	async updateStatus(id: string, status: OrderStatusValue) {
		const db = getDb();
		const [order] = await db
			.update(orders)
			.set({ status, updatedAt: new Date() })
			.where(eq(orders.id, id))
			.returning();
		return order ?? null;
	}
}