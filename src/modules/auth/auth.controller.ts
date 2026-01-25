import type { Request, Response } from "express";
import { config } from "@/config";
import { TTL } from "@/constants";
import { ApiError } from "@/helpers";
import { logger } from "@/utils";
import { AuthService } from "./auth.service";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_MAX_AGE = TTL.REFRESH_TOKEN_IN_SECONDS * 1000;
const ACCESS_EXPIRES_IN = TTL.ACCESS_TOKEN_IN_SECONDS;

const setRefreshCookie = (res: Response, refreshToken: string) => {
	res.cookie(REFRESH_COOKIE, refreshToken, {
		httpOnly: true,
		secure: config.server.env === "production",
		sameSite: "strict",
		maxAge: REFRESH_COOKIE_MAX_AGE,
	});
};

const clearRefreshCookie = (res: Response) => {
	res.clearCookie(REFRESH_COOKIE, {
		httpOnly: true,
		secure: config.server.env === "production",
		sameSite: "strict",
	});
};

export class AuthController {
	static instance: AuthController;

	private service: AuthService;

	static getInstance(): AuthController {
		if (!this.instance) {
			this.instance = new AuthController();
		}
		return this.instance;
	}

	/** @private - use AuthController.getInstance() */
	private constructor() {
		this.service = AuthService.getInstance();
	}

	register = async (req: Request, res: Response) => {
		try {
			const { name, email, password } = req.body;
			const { user, tokens } = await this.service.register(
				name,
				email,
				password,
			);

			setRefreshCookie(res, tokens.refreshToken);

			res.status(201).json({
				message: "User registered successfully",
				status: "USER_REGISTERED",
				data: {
					id: user.id,
					name: user.name,
					email: user.email,
					accessToken: tokens.accessToken,
					expiresIn: ACCESS_EXPIRES_IN,
				},
			});
		} catch (error) {
			if (error instanceof ApiError) {
				return res
					.status(error.statusCode)
					.json({ error: error.message });
			}
			logger.error(
				`Registration error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(500).json({
				error: "Registration failed",
				code: "REGISTRATION_ERROR",
				...(config.server.env === "development" && {
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				}),
			});
		}
	};

	login = async (req: Request, res: Response) => {
		try {
			const { email, password } = req.body;
			const { user, tokens } = await this.service.login(email, password);

			setRefreshCookie(res, tokens.refreshToken);

			res.json({
				status: "USER_LOGGED_IN",
				message: "User logged in successfully",
				data: {
					id: user.id,
					name: user.name,
					email: user.email,
					accessToken: tokens.accessToken,
					expiresIn: ACCESS_EXPIRES_IN,
				},
			});
		} catch (error) {
			if (error instanceof ApiError) {
				return res.status(error.statusCode).json({
					error: error.message,
					...(error.code && { code: error.code }),
				});
			}
			logger.error(
				`Login error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(500).json({
				error: "Login failed",
				code: "LOGIN_ERROR",
				...(config.server.env === "development" && {
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				}),
			});
		}
	};

	refreshToken = async (req: Request, res: Response) => {
		try {
			const refreshToken =
				req.cookies?.refreshToken || req.body.refreshToken;

			if (!refreshToken) {
				return res.status(401).json({
					error: "No refresh token provided",
					code: "MISSING_REFRESH_TOKEN",
				});
			}

			const { user, tokens } = await this.service.refresh(refreshToken);

			setRefreshCookie(res, tokens.refreshToken);

			res.json({
				status: "USER_LOGGED_IN",
				message: "User logged in successfully",
				data: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					accessToken: tokens.accessToken,
					refreshToken: tokens.refreshToken,
					expiresIn: ACCESS_EXPIRES_IN,
				},
			});
		} catch (error) {
			logger.warn(
				`Refresh token error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(401).json({
				error: "Invalid refresh token",
				code: "INVALID_REFRESH_TOKEN",
			});
		}
	};

	logout = async (req: Request, res: Response) => {
		try {
			const refreshToken =
				req.cookies?.refreshToken || req.body.refreshToken;
			await this.service.logout(refreshToken);

			clearRefreshCookie(res);

			res.status(200).json({ message: "Logged out successfully" });
		} catch (error) {
			logger.error(
				`Logout error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(500).json({
				error: "Logout failed",
				code: "LOGOUT_ERROR",
			});
		}
	};

	getProfile = async (req: Request, res: Response) => {
		try {
			const user = await this.service.getProfile(req.user!.id);
			res.json(user);
		} catch (error) {
			if (error instanceof ApiError) {
				return res.status(error.statusCode).json({
					error: error.message,
					...(error.code && { code: error.code }),
				});
			}
			logger.error(
				`Profile error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			res.status(500).json({
				error: "Failed to fetch profile",
				code: "PROFILE_FETCH_ERROR",
				...(config.server.env === "development" && {
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				}),
			});
		}
	};

	adminDashboard = (req: Request, res: Response) => {
		try {
			res.json({
				status: "success",
				message: "Welcome to Admin Dashboard",
				data: {
					secretData: "This is sensitive admin data",
				},
			});
		} catch {
			res.status(500).json({
				status: "error",
				message: "Internal server error",
				code: "ADMIN_ERROR",
			});
		}
	};
}
