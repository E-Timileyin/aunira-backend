import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db/postgres.db";
import { categories, products, type NewProduct } from "./product.model";

export interface ProductWithCategory {
	id: string;
	name: string;
	description: string | null;
	price: number;
	image_url: string | null;
	sku: string | null;
	categoryId: string | null;
	createdAt: Date;
	updatedAt: Date;
	category: { id: string; name: string } | null;
}

const withCategory = async (
	product: typeof products.$inferSelect,
): Promise<ProductWithCategory> => {
	const db = getDb();

	if (!product.categoryId) {
		return { ...product, category: null };
	}

	const [category] = await db
		.select({ id: categories.id, name: categories.name })
		.from(categories)
		.where(eq(categories.id, product.categoryId));

	return { ...product, category: category ?? null };
};

const buildWhere = (category?: string, search?: string) => {
	const conditions = [];

	if (category) {
		conditions.push(eq(products.categoryId, category));
	}

	if (search) {
		const pattern = `%${search}%`;
		conditions.push(
			or(
				ilike(products.name, pattern),
				ilike(products.description, pattern),
				ilike(products.sku, pattern),
			),
		);
	}

	return conditions.length > 0 ? and(...conditions) : undefined;
};

export class ProductRepository {
	async create(data: {
		name: string;
		description?: string | null;
		price: number;
		image_url?: string | null;
		sku?: string | null;
		categoryId?: string | null;
	}) {
		const db = getDb();
		const now = new Date();
		const [product] = await db
			.insert(products)
			.values({
				...data,
				id: randomUUID(),
				createdAt: now,
				updatedAt: now,
			})
			.returning();
		if (!product) {
			throw new Error("Product insert returned no row");
		}
		return withCategory(product);
	}

	async findAll(options: {
		page?: number;
		limit?: number;
		category?: string;
		search?: string;
	}) {
		const db = getDb();
		const page = Math.max(1, options.page ?? 1);
		const limit = Math.max(1, options.limit ?? 10);

		const where = buildWhere(options.category, options.search);

		const [rows, totalRow] = await Promise.all([
			db
				.select({
					id: products.id,
					name: products.name,
					description: products.description,
					price: products.price,
					image_url: products.image_url,
					sku: products.sku,
					categoryId: products.categoryId,
					createdAt: products.createdAt,
					updatedAt: products.updatedAt,
					categoryId2: categories.id,
					categoryName: categories.name,
				})
				.from(products)
				.leftJoin(categories, eq(products.categoryId, categories.id))
				.where(where)
				.orderBy(desc(products.createdAt))
				.limit(limit)
				.offset((page - 1) * limit),
			db.select({ value: count() }).from(products).where(where),
		]);

		const list = rows.map((row) => ({
			id: row.id,
			name: row.name,
			description: row.description,
			price: row.price,
			image_url: row.image_url,
			sku: row.sku,
			categoryId: row.categoryId,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			category: row.categoryId2
				? { id: row.categoryId2, name: row.categoryName }
				: null,
		}));

		const total = totalRow[0]?.value ?? 0;

		return {
			products: list,
			pagination: { page, limit, total, pages: Math.ceil(total / limit) },
		};
	}

	async findById(id: string): Promise<ProductWithCategory | null> {
		const db = getDb();
		const [product] = await db
			.select({
				id: products.id,
				name: products.name,
				description: products.description,
				price: products.price,
				image_url: products.image_url,
				sku: products.sku,
				categoryId: products.categoryId,
				createdAt: products.createdAt,
				updatedAt: products.updatedAt,
				categoryId2: categories.id,
				categoryName: categories.name,
			})
			.from(products)
			.leftJoin(categories, eq(products.categoryId, categories.id))
			.where(eq(products.id, id));

		if (!product) {
			return null;
		}

		return {
			id: product.id,
			name: product.name,
			description: product.description,
			price: product.price,
			image_url: product.image_url,
			sku: product.sku,
			categoryId: product.categoryId,
			createdAt: product.createdAt,
			updatedAt: product.updatedAt,
			category: product.categoryId2
				? { id: product.categoryId2, name: product.categoryName! }
				: null,
		};
	}

	async update(
		id: string,
		data: {
			name?: string;
			description?: string | null;
			price?: number;
			image_url?: string | null;
			sku?: string | null;
			categoryId?: string | null;
		},
	) {
		const db = getDb();
		const [product] = await db
			.update(products)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(products.id, id))
			.returning();

		if (!product) {
			return null;
		}

		return withCategory(product);
	}

	async deleteById(id: string) {
		const db = getDb();
		const [product] = await db
			.delete(products)
			.where(eq(products.id, id))
			.returning();
		return product ?? null;
	}
}
