import { z } from "zod";

export const updateProfileSchema = z.object({
	name: z.string().trim().min(2).max(50).optional(),
	email: z.email().optional(),
	phone: z.number().int().nonnegative().optional(),
});

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});