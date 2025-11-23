import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getDb } from "@/db/postgres.db";
import { logger } from "@/utils";

/**
 * Health check for load balancers / uptime monitors. Verifies the database
 * connection and reports connectivity in the response body.
 */
export const healthCheck = async (req: Request, res: Response) => {
	try {
		const db = getDb();
		await db.execute("select 1");
		res.status(StatusCodes.OK).json({
			status: "ok",
			database: "connected",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error(
			`Database connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
			status: "error",
			database: "disconnected",
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		});
	}
};