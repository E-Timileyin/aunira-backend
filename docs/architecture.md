# Architecture

Feature-first modular monolith. One deployable, module boundaries drawn where service boundaries would go.

## Layers

```
        HTTP
         |
    routes          express.Router wiring only
         |
   controller       request/response shaping, status codes, error mapping
         |
    service         business rules, ordering, invariants
         |
   repository       SQL via Drizzle; the only layer that touches the DB
         |
     model          pgTable / pgEnum definitions, inferred types
```

Dependencies point down and never back up.
A service never imports `Request` or `Response`; a repository is never imported by a controller.

## Module map

Each module is a folder with the same file set: `model`, `repository`, `service`, `schema`, `controller`, `routes`, `index`.

| Module | Responsibility | Notable |
| --- | --- | --- |
| `auth` | register, login, refresh, logout, profile | refresh-token rotation, Redis session store |
| `user` | profile read/update, password change, admin user list | revoke sessions on password change and delete |
| `product` | catalog CRUD, search, pagination | left join to `Category`, `ilike` OR search |
| `cart` | per-user cart, add/remove items | upsert increments quantity instead of inserting duplicates |
| `order` | checkout from cart, cancel, status | order + items written in one transaction |
| `admin` | cross-user reads, order status, dashboard stats | single role guard on the parent router |

Shared code sits outside the modules:

```
src/config      env.ts (zod-validated), config.ts (jwt/redis/server)
src/constants   TTLs, password-hash rounds
src/enums       TokenType
src/db          postgres.db.ts, redis.db.ts, schema aggregate, migrations/
src/helpers     ApiError, health-check, send-response
src/middlewares auth guards, validateBody, rate limiter, error, 404, request logger
src/routes      apiRouter aggregating module routers
src/services    jwt.service, redis.service
src/shared      request augmentation (req.user)
src/utils       logger
```

## Entrypoints

`app/server.ts` — wiring and lifecycle.
Middleware order matters: helmet, cors, json/urlencoded, cookie-parser, request logger, auth rate limiter, then routes.

`app/migrate.ts` — custom runner. Reads `dist/migrations` in prod and `src/db/migrations` in dev, records each file's SHA-256 in `__drizzle_migrations`, and splits files on `--> statement-breakpoint`.
Duplicate-object Postgres errors (`42710`, `42P07`, `42P16`, `42701`, `42704`) are treated as already-applied, so the runner is safe against a database that was provisioned before the runner existed.

## Boot sequence

`connectPostgresDB(startServer)` — the listener only starts after a successful `SELECT 1`.
`connectRedisDB()` — pings and exits the process on failure.
Shutdown on `SIGTERM`/`SIGINT` closes the HTTP server, drains the pg pool, quits Redis, and force-exits after 10s if connections refuse to drain.

## Boundaries and rules

- Repositories return plain rows or mapped shapes; they never throw `ApiError`.
- Services throw `ApiError` with a stable `code`; controllers translate that into the response.
- Validation happens once, at the edge, via `validateBody(schema)`; services still assert their own preconditions.
- Each module exports a router from `index.ts`; `src/routes/index.ts` mounts them under `/api`.

## Type flow

Drizzle infers row types from the table definitions (`typeof users.$inferSelect`).
Those flow through repository signatures into services, so a column rename is a compile error rather than a runtime `undefined`.
Enum values come from the pgEnum itself — `OrderStatus.enumValues` — so the app and the database cannot disagree about allowed statuses.
