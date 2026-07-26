import { describe, expect, it } from "vitest";
import { ApiError } from "@/helpers";
import { AuthService } from "@/modules/auth/auth.service";

const authService = AuthService.getInstance();

const expectApiError = async (
	promise: Promise<unknown>,
	status: number,
	message: string,
) => {
	try {
		await promise;
		throw new Error("expected an ApiError");
	} catch (error) {
		expect(error).toBeInstanceOf(ApiError);
		expect((error as ApiError).statusCode).toBe(status);
		expect((error as ApiError).message).toBe(message);
	}
};

describe("AuthService.register — inline validation (before any DB access)", () => {
	it("rejects missing fields", async () => {
		await expectApiError(
			authService.register("", "", ""),
			400,
			"Name, email and password are required",
		);
	});

	it("rejects an invalid email format", async () => {
		await expectApiError(
			authService.register("John", "not-an-email", "password123"),
			400,
			"Invalid email format",
		);
	});

	it("rejects passwords shorter than 8 characters", async () => {
		await expectApiError(
			authService.register("John", "john@example.com", "short"),
			400,
			"Password must be at least 8 characters long",
		);
	});
});

describe("AuthService.login — inline validation", () => {
	it("rejects missing credentials", async () => {
		await expectApiError(
			authService.login("", ""),
			400,
			"Email and password are required",
		);
	});
});