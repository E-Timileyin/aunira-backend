import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const UserRole = pgEnum("UserRole", ["ADMIN", "USER"]);

export const users = pgTable(
	"User",
	{
		id: text("id").primaryKey(),
		email: text("email").notNull(),
		name: text("name"),
		password: text("password").notNull(),
		role: UserRole("role").notNull().default("USER"),
		isEmailVerified: boolean("isEmailVerified").notNull().default(false),
		lastLoginAt: timestamp("lastLoginAt", { precision: 3, mode: "date" }),
		phone: integer("phone"),
		createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", {
			precision: 3,
			mode: "date",
		}).notNull(),
	},
	(table) => [uniqueIndex("User_email_key").on(table.email)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
