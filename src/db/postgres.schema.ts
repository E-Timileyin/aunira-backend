/**
 * Single schema object for drizzle. Re-exports every module's tables so
 * queries can reference the full schema and drizzle-kit generates correct
 * FK constraints from the relations.
 */
export * from "@/modules/user/user.model";
export * from "@/modules/product/product.model";
export * from "@/modules/cart/cart.model";
export * from "@/modules/order/order.model";