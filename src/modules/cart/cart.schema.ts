import { z } from "zod";

export const addToCartSchema = z.object({
	productId: z.string().min(1, "productId is required"),
	quantity: z.number().int().positive().optional(),
});

export const removeFromCartSchema = z.object({
	productId: z.string().min(1, "productId is required"),
});