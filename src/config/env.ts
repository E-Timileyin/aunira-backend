import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
	PORT: z.coerce.number().default(3000),
	NODE_ENV: z.enum(["development", "production", "staging", "test"]).default("development"),

	CLIENT_URL: z.string().default("http://localhost:3000"),

	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	REDIS_URL: z.string().min(1, "REDIS_URL is required"),

	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
	const missing = Object.entries(parsed.error.flatten().fieldErrors)
		.map(([key, value]) => `  ${key}: ${value[0]}`)
		.join("\n");

	throw new Error(`Invalid environment configuration:\n${missing}`);
}

export const env = parsed.data;