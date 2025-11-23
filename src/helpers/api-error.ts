/** Application error carrying an HTTP status and machine-readable code. */
export class ApiError extends Error {
	statusCode: number;
	code: string;

	constructor(statusCode: number, message: string, code?: string) {
		super(message);
		this.statusCode = statusCode;
		this.code = code ?? "ERROR";
	}
}