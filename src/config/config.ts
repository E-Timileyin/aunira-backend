import { env } from "./env";

export const config = {
	server: {
		port: env.PORT,
		env: env.NODE_ENV,
		clientUrl: env.CLIENT_URL,
	},

	db: {
		uri: env.DATABASE_URL,
	},

	redis: {
		uri: env.REDIS_URL,
	},

	jwt: {
		secret: env.JWT_SECRET,
		refreshSecret: env.REFRESH_TOKEN_SECRET,
		issuer: "aunira-backend",
		audience: ["web", "mobile"],
		accessExpiry: "15m",
		refreshExpiry: "7d",
	},
};