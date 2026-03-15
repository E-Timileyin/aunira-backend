import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { products } from "../product/product.model";
import { users } from "../user/user.model";

export const carts = pgTable("Cart", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
});

export const cartItems = pgTable("CartItem", {
	id: text("id").primaryKey(),
	cartId: text("cartId")
		.notNull()
		.references(() => carts.id, { onDelete: "cascade" }),
	productId: text("productId")
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	quantity: integer("quantity").notNull().default(1),
	createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
});

export const cartItemRelations = relations(cartItems, ({ one }) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id],
		relationName: "CartItem_cartId",
	}),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id],
		relationName: "CartItem_productId",
	}),
}));

export const cartRelations = relations(carts, ({ one }) => ({
	user: one(users, {
		fields: [carts.userId],
		references: [users.id],
		relationName: "Cart_userId",
	}),
}));

export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;