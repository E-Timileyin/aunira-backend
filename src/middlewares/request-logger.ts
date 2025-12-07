import type { NextFunction, Request, Response } from "express";
import { logger } from "@/utils";

export const requestLogger = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const startedAt = Date.now();

	res.on("finish", () => {
		logger.info(
			`${req.method} ${req.path} → ${res.statusCode} (${Date.now() - startedAt}ms)`,
		);
	});

	next();
};
