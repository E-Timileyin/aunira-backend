import { Redis } from "ioredis";
import { config } from "@/config";
import { TTL } from "@/constants";
import { logger } from "@/utils";

const REFRESH_TOKEN_PREFIX = "refresh_token:";

export class RedisService {
	static instance: RedisService;

	private client: Redis;

	static getInstance(): RedisService {
		if (!this.instance) {
			this.instance = new RedisService();
		}
		return this.instance;
	}

	/** @private - use RedisService.getInstance() */
	private constructor() {
		this.client = new Redis(config.redis.uri, {
			// Let commands fail fast instead of retrying forever when Redis is down.
			maxRetriesPerRequest: null,
		});

		this.client.on("error", (err) => {
			logger.error(
				`Redis Client Error: ${err instanceof Error ? err.message : "Unknown error"}`,
			);
		});
	}

	getRedisClient(): Redis {
		return this.client;
	}

	async setRefreshToken(
		userId: string,
		token: string,
		ttl = TTL.REFRESH_TOKEN_IN_SECONDS,
	): Promise<void> {
		await this.client.set(
			`${REFRESH_TOKEN_PREFIX}${token}`,
			userId.toString(),
			"EX",
			ttl,
		);
	}

	async getRefreshToken(token: string): Promise<string | null> {
		return this.client.get(`${REFRESH_TOKEN_PREFIX}${token}`);
	}

	async deleteRefreshToken(token: string): Promise<number> {
		return this.client.del(`${REFRESH_TOKEN_PREFIX}${token}`);
	}

	/**
	 * Revokes every refresh token that belongs to a user. Used when a user is
	 * deleted or changes their password the keys are stored by token, so the
	 * owning key must be found by scanning.
	 */
	async revokeUserTokens(userId: string): Promise<void> {
		let cursor = "0";
		do {
			const [nextCursor, keys] = await this.client.scan(
				cursor,
				"MATCH",
				`${REFRESH_TOKEN_PREFIX}*`,
				"COUNT",
				100,
			);
			cursor = nextCursor;

			for (const key of keys) {
				const value = await this.client.get(key);
				if (value === userId) {
					await this.client.del(key);
				}
			}
		} while (cursor !== "0");
	}
}
