import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { config } from "@/config";
import { JwtService } from "@/services/jwt.service";

const jwtService = JwtService.getInstance();

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

describe("JwtService.generateTokens", () => {
	it("returns an access token and refresh token", () => {
		const { accessToken, refreshToken } = jwtService.generateTokens({
			id: "user-1",
			email: "a@b.com",
			role: "ADMIN",
		});

		expect(accessToken).toBeTruthy();
		expect(refreshToken).toBeTruthy();

		const decoded = jwt.verify(accessToken, config.jwt.secret) as jwt.JwtPayload;
		expect(decoded.id).toBe("user-1");
		expect(decoded.email).toBe("a@b.com");
		expect(decoded.role).toBe("ADMIN");
		expect(decoded.type).toBe("access");
		expect(decoded.iss).toBe("aunira-backend");
		expect(decoded.aud).toContain("web");
	});

	it("embeds the role claim — without it every admin guard would 403", () => {
		const { accessToken } = jwtService.generateTokens({
			id: "user-2",
			email: "c@d.com",
			role: "USER",
		});
		const decoded = jwt.verify(accessToken, config.jwt.secret) as jwt.JwtPayload;
		expect(decoded.role).toBe("USER");
	});
});

describe("JwtService.authenticateToken", () => {
	it("rejects a request with no bearer token (401 MISSING_TOKEN)", async () => {
		const req = { headers: {}, user: undefined };
		const res = makeRes();
		const next = vi.fn();

		await jwtService.authenticateToken(req as never, res as never, next);

		expect(res.statusCode).toBe(401);
		expect(res.body).toEqual({ error: "No token provided", code: "MISSING_TOKEN" });
		expect(next).not.toHaveBeenCalled();
	});

	it("rejects an expired token (403 TOKEN_EXPIRED)", async () => {
		const token = jwt.sign({ id: "u", type: "access" }, config.jwt.secret, {
			expiresIn: "-10s",
			issuer: config.jwt.issuer,
		});

		const req = { headers: { authorization: `Bearer ${token}` }, user: undefined };
		const res = makeRes();
		const next = vi.fn();

		await jwtService.authenticateToken(req as never, res as never, next);

		expect(res.statusCode).toBe(403);
		expect(res.body).toEqual({ error: "Access token expired", code: "TOKEN_EXPIRED" });
	});

	it("rejects a garbage token (403 INVALID_TOKEN)", async () => {
		const req = { headers: { authorization: "Bearer not.a.jwt" }, user: undefined };
		const res = makeRes();
		const next = vi.fn();

		await jwtService.authenticateToken(req as never, res as never, next);

		expect(res.statusCode).toBe(403);
		expect(res.body).toEqual({ error: "Invalid token", code: "INVALID_TOKEN" });
	});

	it("sets req.user and calls next for a valid token", async () => {
		const token = jwt.sign(
			{ id: "u1", email: "a@b.com", role: "ADMIN", type: "access" },
			config.jwt.secret,
			{ expiresIn: "15m", issuer: config.jwt.issuer, audience: config.jwt.audience },
		);

		const req: { headers: Record<string, string | undefined>; user?: unknown } = {
			headers: { authorization: `Bearer ${token}` },
		};
		const res = makeRes();
		const next = vi.fn();

		await jwtService.authenticateToken(req as never, res as never, next);

		expect(next).toHaveBeenCalledOnce();
		expect((req.user as { id: string }).id).toBe("u1");
		expect((req.user as { role?: string }).role).toBe("ADMIN");
	});
});