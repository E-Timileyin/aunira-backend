import { z } from "zod";

const productFields = {
	name: z.string().trim().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().positive("Price must be a positive number"),
	image_url: z.string().optional(),
	sku: z.string().optional(),
	categoryId: z.string().optional(),
};

export const createProductSchema = z.object(productFields);

/** PUT semantics: every field optional, but at least the settable fields map 1:1 to the create schema. */
export const updateProductSchema = z.object({
	name: productFields.name.optional(),
	description: productFields.description,
	price: productFields.price.optional(),
	image_url: productFields.image_url,
	sku: productFields.sku,
	categoryId: productFields.categoryId,
});