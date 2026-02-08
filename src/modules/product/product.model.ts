import { relations } from "drizzle-orm";
import { doublePrecision, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const categories = pgTable("Category", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
});

export const products = pgTable(
	"Product",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		price: doublePrecision("price").notNull(),
		image_url: text("image_url"),
		sku: text("sku"),
		categoryId: text("categoryId").references(() => categories.id, { onDelete: "set null" }),
		createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
	},
	(table) => [uniqueIndex("Product_sku_key").on(table.sku)],
);

export const productRelations = relations(products, ({ one }) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id],
		relationName: "Product_categoryId",
	}),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;