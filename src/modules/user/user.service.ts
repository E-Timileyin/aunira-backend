import bcrypt from "bcryptjs";
import { PASSWORD_HASH } from "@/constants";
import { ApiError } from "@/helpers";
import { RedisService } from "@/services/redis.service";
import { UserRepository } from "./user.repository";

export class UserService {
	static instance: UserService;

	private repository: UserRepository;
	private redisService: RedisService;

	static getInstance(): UserService {
		if (!this.instance) {
			this.instance = new UserService();
		}
		return this.instance;
	}

	/** @private - use UserService.getInstance() */
	private constructor() {
		this.repository = new UserRepository();
		this.redisService = RedisService.getInstance();
	}

	getUsers() {
		return this.repository.findAll();
	}

	/** Returns a public profile — never the password hash. */
	async getUser(id: string) {
		const user = await this.repository.findProfileById(id);
		if (!user) {
			throw new ApiError(404, "User not found");
		}
		return user;
	}

	async getProfile(userId: string) {
		const user = await this.repository.findProfileById(userId);
		if (!user) {
			throw new ApiError(404, "User not found");
		}
		return user;
	}

	async updateProfile(userId: string, data: { name?: string; email?: string; phone?: number | null }) {
		const user = await this.repository.findProfileById(userId);
		if (!user) {
			throw new ApiError(404, "User not found");
		}

		const updates: { name?: string; email?: string; phone?: number | null } = { ...data };

		// Emails are stored lowercase so lookups (login lowercases the input) match.
		if (updates.email) {
			updates.email = updates.email.toLowerCase();
		}

		const updated = await this.repository.updateProfile(userId, updates);
		if (!updated) {
			throw new ApiError(404, "User not found");
		}
		return updated;
	}

	async deleteUser(userId: string) {
		// Revoke every session first — the DB row can't be deleted while doing this after.
		await this.redisService.revokeUserTokens(userId);
		await this.repository.deleteById(userId);
	}

	async changePassword(userId: string, currentPassword: string, newPassword: string) {
		const user = await this.repository.findById(userId);
		if (!user) {
			throw new ApiError(404, "User not found");
		}

		const passwordMatch = await bcrypt.compare(currentPassword, user.password);
		if (!passwordMatch) {
			throw new ApiError(401, "Invalid old password");
		}

		const hashedPassword = await bcrypt.hash(newPassword, PASSWORD_HASH.SALT_ROUNDS);

		const updated = await this.repository.updatePassword(userId, hashedPassword);
		if (!updated) {
			throw new ApiError(404, "User not found");
		}

		// Password changed — invalidate every active refresh token.
		await this.redisService.revokeUserTokens(userId);

		return updated;
	}
}