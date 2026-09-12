# Design Patterns

Patterns actually in use, where they live, and what each one costs.

## 1. Feature-first modular monolith

One deployable, one folder per domain under `src/modules`.
Cross-module imports are rare and one-directional: services reach for another module's repository when they must (`order` reads `cart`), never its controller.

**Why** — the seam between modules is where a service split would happen later.
**Cost** — some shared concepts end up duplicated rather than extracted to a common core.

## 2. Layered flow

`routes → controller → service → repository → model`.

**Why** — each layer has one reason to change. HTTP shape, business rule, and SQL evolve independently.
**Cost** — thin modules pay boilerplate. `product` read paths are close to pass-through.

## 3. Repository

All SQL lives in `<module>.repository.ts`. Nothing above it builds a query.

**Why** — swapping storage, adding caching, or writing a fake for a test has exactly one place to touch.
**Cost** — on pure CRUD it is an extra hop. The payoff shows on the compound reads: `getOrdersAdmin` aggregates three joins into a grouped shape in one place.

## 4. Service layer holding invariants

Business rules live in services: cart must exist, order must not be cancelled twice, a password change revokes sessions.

**Why** — rules stay true regardless of caller. The HTTP layer cannot forget them.
**Cost** — services need the repository injected, which is hand-wired in the constructor.

## 5. Singleton via `getInstance()`

Every service and repository is a class with a private constructor, a static `instance`, and `getInstance()`.

```ts
static getInstance(): OrderService {
	if (!this.instance) this.instance = new OrderService();
	return this.instance;
}
```

**Why** — shared state (pg pool, Redis client, JWT config) without a DI container.
**Cost** — cannot inject a double through the public API. This is the first thing to hurt if test isolation ever becomes important.

## 6. Middleware chain for cross-cutting concerns

helmet, cors, body parsing, cookie parsing, request logging, rate limiting, auth guards, 404, error handler — each a separate middleware in `app/server.ts`.

**Why** — order is explicit and readable top to bottom.
**Cost** — a misplaced `app.use` silently changes semantics for every route below it.

## 7. Errors as control flow

Services throw `ApiError(status, message, code)`. Controllers catch and map. The global handler is the backstop.

**Why** — one place decides response shape; services stay free of `res`.
**Cost** — thrown errors are invisible in signatures. Repository methods must not throw `ApiError` or the layer boundary blurs.

## 8. Validation at the edge

`validateBody(schema)` parses `req.body` with zod and replaces it with the typed result, so downstream code works with parsed values.

**Why** — validation happens once. Coercion and defaults live with the schema.
**Cost** — two validation styles coexist: `validateBody` for most routes, inline checks in `auth.register`/`auth.login` to preserve their exact error messages.

## 9. Guard middleware

`requireAdmin` rejects unless `req.user.role === "ADMIN"`, failing closed when the claim is absent.
Mounted once on the parent admin router, so it also covers the nested dashboard router.

**Why** — a single mount cannot be forgotten on a newly added route.
**Cost** — per-route role differences need a new router level rather than a parameter.

## 10. Enum-driven validation

Allowed statuses come from the pgEnum itself (`OrderStatus.enumValues`), not a hand-copied array.

**Why** — the app and the database cannot drift apart on allowed values.
**Cost** — none meaningful; adding a status requires a migration, which is the correct friction.

## 11. Idempotent write

`cart.upsertItem` increments quantity when the line exists and inserts when it does not.

**Why** — "add to cart" is a quantity operation, not an insert. Re-adding is the common case.
**Cost** — needs a unique constraint on `(cartId, productId)` to be truly race-safe at the database level.

## 12. Rotating refresh tokens

`/auth/refresh-token` issues a new refresh token, deletes the old key, and stores the new one. Tokens are Redis keys mapping `refresh_token:<token> → userId`.

**Why** — a stolen refresh token has a bounded lifetime and its use is detectable.
**Cost** — concurrent refreshes from two devices can invalidate one another; a grace window would fix that if it ever bites.

## 13. Barrel exports

Every module has `index.ts` re-exporting its parts.

**Why** — imports stay short and the module's public surface is declared in one file.
**Cost** — careless barrels create import cycles. Keep them to re-exports only.

## 14. Schema aggregate

`src/db/postgres.schema.ts` imports every module's model so `drizzle()` and `drizzle-kit` see one complete schema.

**Why** — models stay next to the feature that owns them while tooling still gets a single entry point.
**Cost** — any new module must be added here or its tables silently vanish from generated migrations.
