import type { Response } from "express";

export const sendSuccessResponse = (
	res: Response,
	data: unknown,
	statusCode = 200,
) => {
	return res.status(statusCode).json({
		timestamp: new Date().toISOString(),
		status: statusCode,
		success: true,
		data,
	});
};

export const sendErrorResponse = (
	res: Response,
	error: unknown,
	statusCode = 500,
) => {
	return res.status(statusCode).json({
		timestamp: new Date().toISOString(),
		status: statusCode,
		success: false,
		error,
	});
};
