import rateLimit from "express-rate-limit";
import { TTL } from "@/constants";

export const authLimiter = rateLimit({
	windowMs: TTL.RATE_LIMIT_WINDOW_MS,
	limit: TTL.RATE_LIMIT_MAX,
	message: {
		status: "error",
		code: "TOO_MANY_REQUESTS",
		message:
			"Too many requests from this IP, please try again after 15 minutes",
	},
});
