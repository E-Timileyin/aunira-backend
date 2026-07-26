import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "src"),
			"@/app": path.resolve(import.meta.dirname, "app"),
		},
	},
	test: {
		environment: "node",
		// env.ts validates these at import time — supply them for every test.
		env: {
			DATABASE_URL: "postgres://test:test@localhost:5432/test",
			REDIS_URL: "redis://localhost:6379",
			JWT_SECRET: "test-jwt-secret",
			REFRESH_TOKEN_SECRET: "test-refresh-secret",
			NODE_ENV: "test",
			CLIENT_URL: "http://localhost:3000",
			PORT: "3000",
		},
	},
});