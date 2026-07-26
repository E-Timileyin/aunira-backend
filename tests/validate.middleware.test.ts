import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateBody } from "@/middlewares/validate";

const makeRes = () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const res: any = {
		statusCode: 0,
		body: null,
		status(code: number) {
			this.statusCode = code;
			return this;
		},
		json(body: unknown) {
			this.body = body;
			return this;
		},
	};
	return res;
};

const schema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email"),
});

describe("validateBody middleware", () => {
	it("returns 400 VALIDATION_ERROR with per-field errors on failure", async () => {
		const req = { body: { name: "", email: "nope" } };
		const res = makeRes();
		const next = vi.fn();

		await validateBody(schema)(req as never, res as never, next);

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			status: "error",
			code: "VALIDATION_ERROR",
			message: "Validation error",
		});
		expect(res.body.errors).toEqual(
			expect.arrayContaining([
				{ field: "name", message: "Name is required" },
				{ field: "email", message: expect.any(String) },
			]),
		);
		expect(next).not.toHaveBeenCalled();
	});

	it("assigns the parsed body and calls next on success", async () => {
		const req = { body: { name: "Ada", email: "ada@example.com" } };
		const res = makeRes();
		const next = vi.fn();

		await validateBody(schema)(req as never, res as never, next);

		expect((req.body as { name: string }).name).toBe("Ada");
		expect(next).toHaveBeenCalledOnce();
	});
});
