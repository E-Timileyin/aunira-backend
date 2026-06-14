import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import type { Server } from "node:http";
import { config } from "@/config";
import { closePostgresDB, connectPostgresDB, connectRedisDB } from "@/db";
import { healthCheck } from "@/helpers";
import {
	authLimiter,
	errorHandler,
	requestLogger,
	routeNotFound,
} from "@/middlewares";
import { adminRouter } from "@/modules/admin";
import { authRouter } from "@/modules/auth";
import { cartRouter } from "@/modules/cart";
import { orderRouter } from "@/modules/order";
import { productRouter } from "@/modules/product";
import { userRouter } from "@/modules/user";
import { apiRouter } from "@/routes";
import { RedisService } from "@/services";
import { logger } from "@/utils";

const app = express();

app.disable("x-powered-by");

// Security + parsing middleware
app.use(helmet());
app.use(
	cors({
		origin: config.server.clientUrl,
		credentials: true,
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// Rate limiting for auth routes
app.use("/api/auth", authLimiter);

// Health Check Endpoint
app.get("/api/health", healthCheck);

// API Routes
app.use("/api/auth", authRouter);
app.use("/api", apiRouter);

// 404 handler
app.use(routeNotFound);

// Global error handler (Express 5 forwards rejected promises here)
app.use(errorHandler);

let server: Server;
let currentPort = config.server.port;

function startServer(port: number = currentPort) {
	server = app.listen(port, () => {
		logger.info(
			`Server is running on port ${port} in ${config.server.env} mode`,
		);
	});

	server.on("error", (err: NodeJS.ErrnoException) => {
		if (err.code === "EADDRINUSE") {
			const nextPort = port + 1;
			logger.error(
				`Port ${port} is already in use. Retrying with port ${nextPort}`,
			);
			currentPort = nextPort;
			setTimeout(() => {
				server.close();
				startServer(nextPort);
			}, 1000);
		} else {
			logger.error(`Failed to start server: ${err.message}`);
			throw err;
		}
	});
}

connectPostgresDB(startServer);
connectRedisDB();

const shutdown = (signal: string) => {
	logger.info(`${signal} received — shutting down gracefully`);

	server.close(async () => {
		try {
			await closePostgresDB();
			await RedisService.getInstance().getRedisClient().quit();
		} catch (error) {
			logger.error(
				`Error during shutdown: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
		process.exit(0);
	});

	// Force-exit if connections refuse to drain.
	setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
