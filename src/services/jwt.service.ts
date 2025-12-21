import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import { TokenType } from "@/enums";
import type { JwtPayload } from "@/shared/interfaces";
import { logger } from "@/utils";
import { RedisService } from "./redis.service";

const { sign, verify } = jwt;

export interface Tokens {
	accessToken: string;
	refreshToken: string;
}

export class JwtService {
	static instance: JwtService;

	private redisService: RedisService;

	static getInstance(): JwtService {
		if (!this.instance) {
			this.instance = new JwtService();
		}
		return this.instance;
	}

	/** @private - use JwtService.getInstance() */
	private constructor() {
		this.redisService = RedisService.getInstance();
	}

	generateTokens = (user: {
		id: string;
		email?: string;
		role?: string;
	}): Tokens => {
		const accessToken = sign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
				type: TokenType.ACCESS,
			},
			config.jwt.secret,
			{
				expiresIn: config.jwt
					.accessExpiry as jwt.SignOptions["expiresIn"],
				issuer: config.jwt.issuer,
				audience: config.jwt.audience,
			},
		);

		const refreshToken = sign(
			{
				id: user.id,
				type: TokenType.REFRESH,
			},
			config.jwt.refreshSecret,
			{
				expiresIn: config.jwt
					.refreshExpiry as jwt.SignOptions["expiresIn"],
				issuer: config.jwt.issuer,
				audience: config.jwt.audience,
			},
		);

		return { accessToken, refreshToken };
	};

	authenticateToken = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const authHeader = req.headers["authorization"];
		const token = authHeader?.split(" ")[1];

		if (!token) {
			return res.status(401).json({
				error: "No token provided",
				code: "MISSING_TOKEN",
			});
		}

		try {
			const decoded = verify(token, config.jwt.secret);
			req.user = decoded as unknown as JwtPayload;
			next();
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return res.status(403).json({
					error: "Access token expired",
					code: "TOKEN_EXPIRED",
				});
			}
			logger.warn(
				`Invalid token attempt: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			return res.status(403).json({
				error: "Invalid token",
				code: "INVALID_TOKEN",
			});
		}
	};

	verifyRefreshToken = async (
		refreshToken: string,
	): Promise<{ id: string }> => {
		const decoded = verify(refreshToken, config.jwt.refreshSecret) as {
			id: string;
		};

		// Token must still be registered in Redis (not logged out / revoked).
		const userId = await this.redisService.getRefreshToken(refreshToken);
		if (!userId || userId !== decoded.id) {
			throw new Error("Invalid refresh token");
		}

		return decoded;
	};
}
