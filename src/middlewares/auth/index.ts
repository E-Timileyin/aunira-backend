import { JwtService } from "@/services/jwt.service";

export { requireAdmin } from "./guards";

/** @info - Bound instance method; routes import this directly. */
export const authenticateToken = JwtService.getInstance().authenticateToken;

export const jwtService = JwtService.getInstance();