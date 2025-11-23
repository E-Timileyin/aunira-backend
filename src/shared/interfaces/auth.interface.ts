import type { TokenType } from "@/enums";

/** Claims present on both access and refresh tokens. */
export interface JwtPayload {
	id: string;
	email?: string;
	role?: string;
	type: TokenType;
	iat: number;
	exp: number;
	iss: string;
	aud: string | string[];
}

/** Decoded access token attached to the request by the auth middleware. */
export interface AuthUser {
	id: string;
	email?: string;
	role?: string;
	type: TokenType;
}

declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}