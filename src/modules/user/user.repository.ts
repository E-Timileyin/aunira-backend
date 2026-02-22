import { randomUUID } from "node:crypto";
import { count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db/postgres.db";
import { users, type NewUser } from "./user.model";

/** Public profile fields — never includes the password hash. */
const publicColumns = {
	id: users.id,
	name: users.name,
	email: users.email,
	phone: users.phone,
	role: users.role,
	createdAt: users.createdAt,
	updatedAt: users.updatedAt,
};

export class UserRepository {
	async findByEmail(email: string) {
		const db = getDb();
		const [user] = await db.select().from(users).where(eq(users.email, email));
		return user;
	}

	async findById(id: string) {
		const db = getDb();
		const [user] = await db.select().from(users).where(eq(users.id, id));
		return user;
	}

	async findProfileById(id: string) {
		const db = getDb();
		const [user] = await db
			.select(publicColumns)
			.from(users)
			.where(eq(users.id, id));
		return user;
	}

	/** Auth-facing profile used by /auth/profile (includes role + verification). */
	async findAuthProfileById(id: string) {
		const db = getDb();
		const [user] = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				isEmailVerified: users.isEmailVerified,
				lastLoginAt: users.lastLoginAt,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.where(eq(users.id, id));
		return user;
	}

	async findAll() {
		const db = getDb();
		return db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users);
	}

	async create(data: Omit<NewUser, "id" | "role" | "isEmailVerified" | "createdAt" | "updatedAt">) {
		const db = getDb();
		const now = new Date();
		const [user] = await db
			.insert(users)
			.values({
				...data,
				id: randomUUID(),
				role: "USER",
				isEmailVerified: false,
				createdAt: now,
				updatedAt: now,
			})
			.returning();
		return user;
	}

	async updateProfile(id: string, data: { name?: string; email?: string; phone?: number | null }) {
		const db = getDb();
		const [user] = await db
			.update(users)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(users.id, id))
			.returning(publicColumns);
		return user;
	}

	async updatePassword(id: string, password: string) {
		const db = getDb();
		const [user] = await db
			.update(users)
			.set({ password, updatedAt: new Date() })
			.where(eq(users.id, id))
			.returning(publicColumns);
		return user;
	}

	async updateLastLogin(id: string) {
		const db = getDb();
		await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
	}

	async deleteById(id: string) {
		const db = getDb();
		await db.delete(users).where(eq(users.id, id));
	}

	/** Counts used by the admin dashboard (total / active / new users). */
	async getCounts() {
		const db = getDb();
		const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		const [total, active, newUsers] = await Promise.all([
			db.select({ value: count() }).from(users),
			db.select({ value: count() }).from(users).where(gte(users.lastLoginAt, since30Days)),
			db.select({ value: count() }).from(users).where(gte(users.createdAt, since30Days)),
		]);

		return {
			totalUsers: total[0]?.value ?? 0,
			activeUsers: active[0]?.value ?? 0,
			newUsers: newUsers[0]?.value ?? 0,
		};
	}
}