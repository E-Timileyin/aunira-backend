import bcrypt from "bcryptjs";
import { PASSWORD_HASH, TTL } from "@/constants";
import { ApiError } from "@/helpers";
import { JwtService } from "@/services/jwt.service";
import { RedisService } from "@/services/redis.service";
import { UserRepository } from "@/modules/user/user.repository";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DUMMY_HASH = bcrypt.hashSync(
	"password-enumeration-guard",
	PASSWORD_HASH.SALT_ROUNDS,
);

export interface AuthResult {
	user: { id: string; name: string | null; email: string; role: string };
	tokens: { accessToken: string; refreshToken: string };
}

export class AuthService {
	static instance: AuthService;

	private repository: UserRepository;
	private redisService: RedisService;
	private jwtService: JwtService;

	static getInstance(): AuthService {
		if (!this.instance) {
			this.instance = new AuthService();
		}
		return this.instance;
	}

	/** @private - use AuthService.getInstance() */
	private constructor() {
		this.repository = new UserRepository();
		this.redisService = RedisService.getInstance();
		this.jwtService = JwtService.getInstance();
	}

	async register(
		name: string,
		email: string,
		password: string,
	): Promise<AuthResult> {
		if (!email || !password || !name) {
			throw new ApiError(400, "Name, email and password are required");
		}

		if (!EMAIL_REGEX.test(email)) {
			throw new ApiError(400, "Invalid email format");
		}

		if (password.length < 8) {
			throw new ApiError(
				400,
				"Password must be at least 8 characters long",
			);
		}

		const existingUser = await this.repository.findByEmail(
			email.toLowerCase(),
		);
		if (existingUser) {
			throw new ApiError(409, "Email already in use");
		}

		const hashedPassword = await bcrypt.hash(
			password,
			PASSWORD_HASH.SALT_ROUNDS,
		);

		const newUser = await this.repository.create({
			name,
			email: email.toLowerCase(),
			password: hashedPassword,
			lastLoginAt: new Date(),
		});

		if (!newUser) {
			throw new Error("Failed to create user");
		}

		const tokens = this.jwtService.generateTokens(newUser);
		await this.redisService.setRefreshToken(
			newUser.id,
			tokens.refreshToken,
		);

		return {
			user: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
				role: newUser.role,
			},
			tokens,
		};
	}

	async login(email: string, password: string): Promise<AuthResult> {
		if (!email || !password) {
			throw new ApiError(400, "Email and password are required");
		}

		const user = await this.repository.findByEmail(email.toLowerCase());
		const passwordMatch = await bcrypt.compare(
			password,
			user?.password ?? DUMMY_HASH,
		);

		if (!user || !passwordMatch) {
			throw new ApiError(
				401,
				"Invalid credentials",
				"INVALID_CREDENTIALS",
			);
		}

		await this.repository.updateLastLogin(user.id);

		const tokens = this.jwtService.generateTokens(user);
		await this.redisService.setRefreshToken(user.id, tokens.refreshToken);

		return {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
			tokens,
		};
	}

	async refresh(refreshToken: string) {
		const decoded = await this.jwtService.verifyRefreshToken(refreshToken);

		const user = await this.repository.findById(decoded.id);
		if (!user) {
			throw new ApiError(401, "User not found", "USER_NOT_FOUND");
		}

		const tokens = this.jwtService.generateTokens(user);

		// Rotate the refresh token: drop the old one, register the new one.
		await this.redisService.deleteRefreshToken(refreshToken);
		await this.redisService.setRefreshToken(user.id, tokens.refreshToken);

		return {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
			tokens,
		};
	}

	async logout(refreshToken?: string) {
		if (refreshToken) {
			await this.redisService.deleteRefreshToken(refreshToken);
		}
	}

	async getProfile(userId: string) {
		const user = await this.repository.findAuthProfileById(userId);
		if (!user) {
			throw new ApiError(404, "User not found", "USER_NOT_FOUND");
		}
		return user;
	}
}
