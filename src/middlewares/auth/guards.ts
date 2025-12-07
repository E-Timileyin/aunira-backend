import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

/**
 * Rejects the request unless the authenticated user has the ADMIN role.
 * The role claim ships in the access token; a missing claim fails closed.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
	if (req.user?.role !== "ADMIN") {
		return res.status(StatusCodes.FORBIDDEN).json({
			status: "error",
			message: "Access denied. Admin privileges required.",
			code: "FORBIDDEN",
		});
	}
	next();
};