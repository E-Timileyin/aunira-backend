import { relations } from "drizzle-orm";
import { doublePrecision, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "../product/product.model";
import { users } from "../user/user.model";

export const OrderStatus = pgEnum("OrderStatus", ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]);

export const orders = pgTable(
	"Order",
	{
		id: text("id").primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		total: doublePrecision("total").notNull(),
		status: OrderStatus("status").notNull().default("PENDING"),
		createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
	},
	(table) => [uniqueIndex("Order_userId_key").on(table.userId)],
);

export const orderItems = pgTable("OrderItem", {
	id: text("id").primaryKey(),
	orderId: text("orderId")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	productId: text("productId")
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	quantity: integer("quantity").notNull().default(1),
	price: doublePrecision("price").notNull(),
	createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
});

export const orderRelations = relations(orders, ({ one }) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id],
		relationName: "Order_userId",
	}),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
		relationName: "OrderItem_orderId",
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id],
		relationName: "OrderItem_productId",
	}),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;

/** Union of allowed status values for the "OrderStatus" enum. */
export type OrderStatusValue = (typeof OrderStatus)["enumValues"][number];