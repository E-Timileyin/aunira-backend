import { RedisService } from "@/services/redis.service";
import { logger } from "@/utils";

const redisService = RedisService.getInstance();

export const connectRedisDB = async () => {
	try {
		const client = redisService.getRedisClient();
		await client.ping();
		logger.info("Connected to Redis ⚡");
		return client;
	} catch (e: unknown) {
		logger.error(
			`Error connecting to Redis: ${e instanceof Error ? e.message : "Unknown error"}`,
		);
		process.exit(1);
	}
};