import type { Request, Response } from "express";
import { ApiError } from "@/helpers";
import { logger } from "@/utils";
import { UserService } from "./user.service";

const FAILED_TO_FETCH_USERS = { error: "Failed to fetch users" };
const FAILED_TO_FETCH_USER = { error: "Failed to fetch user" };
const FAILED_TO_UPDATE_USER = { error: "Failed to update user" };
const FAILED_TO_DELETE_USER = { error: "Failed to delete user" };
const FAILED_TO_CHANGE_PASSWORD = { error: "Failed to change password" };

export class UserController {
	static instance: UserController;

	private service: UserService;

	static getInstance(): UserController {
		if (!this.instance) {
			this.instance = new UserController();
		}
		return this.instance;
	}

	/** @private - use UserController.getInstance() */
	private constructor() {
		this.service = UserService.getInstance();
	}

	getAllUsers = async (req: Request, res: Response) => {
		try {
			const users = await this.service.getUsers();
			res.json(users);
		} catch (error) {
			logger.error(`Error fetching users: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(FAILED_TO_FETCH_USERS);
		}
	};

	getUserById = async (req: Request<{ id: string }>, res: Response) => {
		try {
			const user = await this.service.getUser(req.params.id);
			res.json(user);
		} catch (error) {
			if (error instanceof ApiError) {
				return res.status(error.statusCode).json({ error: error.message });
			}
			logger.error(`Error fetching user: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(FAILED_TO_FETCH_USER);
		}
	};

	getCurrentUserProfile = async (req: Request, res: Response) => {
		try {
			const user = await this.service.getProfile(req.user!.id);
			res.json(user);
		} catch (error) {
			if (error instanceof ApiError) {
				return res.status(error.statusCode).json({ error: error.message });
			}
			logger.error(`Error fetching user: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(FAILED_TO_FETCH_USER);
		}
	};

	updateUserProfile = async (req: Request, res: Response) => {
		try {
			const user = await this.service.updateProfile(req.user!.id, req.body);
			res.json(user);
		} catch (error) {
			if (error instanceof ApiError) {
				return res.status(error.statusCode).json({ error: error.message });
			}
			logger.error(`Error updating user: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(FAILED_TO_UPDATE_USER);
		}
	};

	deleteUser = async (req: Request<{ id: string }>, res: Response) => {
		try {
			await this.service.deleteUser(req.params.id);
			// 204: no body allowed.
			res.clearCookie("refreshToken", {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
			});
			res.status(204).end();
		} catch (error) {
			logger.error(`Error deleting user: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(FAILED_TO_DELETE_USER);
		}
	};

	changePassword = async (req: Request, res: Response) => {
		try {
			const user = await this.service.changePassword(
				req.user!.id,
				req.body.currentPassword,
				req.body.newPassword,
			);
			res.json(user);
		} catch (error) {
			if (error instanceof ApiError) {
				return res.status(error.statusCode).json({ error: error.message });
			}
			logger.error(`Error changing password: ${error instanceof Error ? error.message : "Unknown error"}`);
			res.status(500).json(FAILED_TO_CHANGE_PASSWORD);
		}
	};
}