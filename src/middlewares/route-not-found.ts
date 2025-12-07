import type { Request, Response } from "express";

export const routeNotFound = (req: Request, res: Response) => {
	res.status(404).json({
		status: "error",
		message: "Not Found",
		code: "NOT_FOUND",
	});
};
