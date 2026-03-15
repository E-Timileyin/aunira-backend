import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "@/db/postgres.db";
import { products } from "@/modules/product/product.model";
import { cartItems, carts } from "./cart.model";

export interface CartLine {
	id: string;
	quantity: number;
	productId: string;
	name: string;
	price: number;
	image_url: string | null;
	sku: string | null;
}

export interface CartWithItems {
	id: string;
	items: CartLine[];
	total: number;
}

export class CartRepository {
	async findCartByUserId(userId: string) {
		const db = getDb();
		const [cart] = await db.select().from(carts).where(eq(carts.userId, userId));
		return cart ?? null;
	}

	async createCart(userId: string) {
		const db = getDb();
		const now = new Date();
		const [cart] = await db
			.insert(carts)
			.values({ id: randomUUID(), userId, createdAt: now, updatedAt: now })
			.returning();
		return cart;
	}

	async findOrCreateCart(userId: string) {
		const existing = await this.findCartByUserId(userId);
		return existing ?? this.createCart(userId);
	}

	/**
	 * Adds `quantity` of a product. If the line already exists the quantity
	 * is incremented, otherwise a new line is inserted.
	 */
	async upsertItem(cartId: string, productId: string, quantity: number) {
		const db = getDb();
		const now = new Date();

		const [existing] = await db
			.select()
			.from(cartItems)
			.where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));

		if (existing) {
			await db
				.update(cartItems)
				.set({ quantity: existing.quantity + quantity, updatedAt: now })
				.where(eq(cartItems.id, existing.id));
			await db.update(carts).set({ updatedAt: now }).where(eq(carts.id, cartId));
			return;
		}

		await db
			.insert(cartItems)
			.values({
				id: randomUUID(),
				cartId,
				productId,
				quantity,
				createdAt: now,
				updatedAt: now,
			});
		await db.update(carts).set({ updatedAt: now }).where(eq(carts.id, cartId));
	}

	/**
	 * Removes one unit of a product. The line is deleted once its quantity
	 * would drop to zero; otherwise the quantity is decremented.
	 * Returns the line id when a line existed, null otherwise.
	 */
	async decrementItem(cartId: string, productId: string) {
		const db = getDb();
		const now = new Date();

		const [existing] = await db
			.select()
			.from(cartItems)
			.where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));

		if (!existing) {
			return null;
		}

		if (existing.quantity <= 1) {
			await db.delete(cartItems).where(eq(cartItems.id, existing.id));
		} else {
			await db
				.update(cartItems)
				.set({ quantity: existing.quantity - 1, updatedAt: now })
				.where(eq(cartItems.id, existing.id));
		}

		await db.update(carts).set({ updatedAt: now }).where(eq(carts.id, cartId));
		return existing.id;
	}

	async getCartWithItems(cartId: string): Promise<CartWithItems> {
		const db = getDb();

		const rows = await db
			.select({
				itemId: cartItems.id,
				quantity: cartItems.quantity,
				productId: cartItems.productId,
				name: products.name,
				price: products.price,
				image_url: products.image_url,
				sku: products.sku,
			})
			.from(cartItems)
			.innerJoin(products, eq(cartItems.productId, products.id))
			.where(eq(cartItems.cartId, cartId));

		const items: CartLine[] = rows.map((row) => ({
			id: row.itemId,
			quantity: row.quantity,
			productId: row.productId,
			name: row.name,
			price: row.price,
			image_url: row.image_url,
			sku: row.sku,
		}));

		const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		return { id: cartId, items, total };
	}
}