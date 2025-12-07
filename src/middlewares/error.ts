import type { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { config } from "@/config";
import { logger } from "@/utils";

/** Global error handler. Express 5 forwards rejected promises here. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.stack ?? err}`);

	res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
		status: "error",
		code: "INTERNAL_SERVER_ERROR",
		message: "Something went wrong!",
		...(config.server.env === "development" && { error: err.message }),
	});
};