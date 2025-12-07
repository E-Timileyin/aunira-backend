import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { StatusCodes } from "http-status-codes";

export const validateBody =
	(schema: ZodType) =>
	async (req: Request, res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.body);

		if (!result.success) {
			const errors = result.error.issues.map((issue) => ({
				field: issue.path.join("."),
				message: issue.message,
			}));

			return res.status(StatusCodes.BAD_REQUEST).json({
				status: "error",
				code: "VALIDATION_ERROR",
				message: "Validation error",
				errors,
			});
		}

		req.body = result.data;
		next();
	};
