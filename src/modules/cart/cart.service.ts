import { eq } from "drizzle-orm";
import { getDb } from "@/db/postgres.db";
import { ApiError } from "@/helpers";
import { products } from "@/modules/product/product.model";
import { CartRepository } from "./cart.repository";

export class CartService {
	static instance: CartService;

	private repository: CartRepository;

	static getInstance(): CartService {
		if (!this.instance) {
			this.instance = new CartService();
		}
		return this.instance;
	}

	/** @private - use CartService.getInstance() */
	private constructor() {
		this.repository = new CartRepository();
	}

	/** Returns the user's cart, or an empty cart structure when none exists yet. */
	async getCart(userId: string) {
		const cart = await this.repository.findCartByUserId(userId);
		if (!cart) {
			return { id: null, items: [], total: 0 };
		}
		return this.repository.getCartWithItems(cart.id);
	}

	async addToCart(userId: string, productId: string, quantity = 1) {
		// The API contract requires an existing product (cart lines reference it).
		// The FK enforces this at the DB level too; we check first for a clean 404.
		const db = getDb();
		const [product] = await db.select().from(products).where(eq(products.id, productId));
		if (!product) {
			throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
		}

		const cart = await this.repository.findOrCreateCart(userId);
		if (!cart) {
			throw new ApiError(500, "Failed to create cart", "CART_CREATE_ERROR");
		}

		await this.repository.upsertItem(cart.id, productId, quantity);

		return this.repository.getCartWithItems(cart.id);
	}

	async removeFromCart(userId: string, productId: string) {
		const cart = await this.repository.findCartByUserId(userId);
		if (!cart) {
			throw new ApiError(404, "Cart not found", "CART_NOT_FOUND");
		}

		const removed = await this.repository.decrementItem(cart.id, productId);
		if (!removed) {
			throw new ApiError(404, "Item not found in cart", "ITEM_NOT_FOUND");
		}

		return this.repository.getCartWithItems(cart.id);
	}
}