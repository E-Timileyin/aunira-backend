# 🗂 Aunira Backend — Structure

Express 5 + TypeScript + Drizzle ORM on PostgreSQL (Neon) with Redis-backed
refresh-token sessions. Module-per-feature layout: one folder per domain, layered
routes → controller → service → repository → model.

Architecture, patterns, and data flow live in [`docs/`](./docs/README.md).

## Stack

| Layer      | Tech                                                    |
| ---------- | ------------------------------------------------------- |
| API        | Express 5                                               |
| ORM        | Drizzle (pg driver via `pg` Pool)                       |
| DB         | PostgreSQL (Neon)                                       |
| Cache      | Redis (ioredis) — refresh-token store                   |
| Auth       | JWT (access 15m / rotating refresh 7d) + bcrypt         |
| Validation | zod (`validateBody` middleware)                         |
| Build      | esbuild (`build.ts`) → `dist/`, tsx for dev/migrations  |
| Tests      | vitest                                                  |

## Layout

```
app/
  server.ts          # entrypoint: express wiring, health check, graceful shutdown
  migrate.ts         # custom SHA-256 migration runner (idempotent)
src/
  config/            # env.ts (zod-validated env) + config.ts (jwt/redis constants)
  constants/         # TTLs, password hash rounds
  enums/             # TokenType
  db/                # postgres.db.ts (pool+drizzle), redis.db.ts, schema aggregate,
                     #   migrations/ (drizzle-kit SQL + snapshot)
  helpers/           # api-error.ts, health-check.ts, response/
  middlewares/       # auth/ (authenticateToken, requireAdmin), validate, rate-limit,
                     #   error, request-logger, route-not-found
  modules/           # one folder per feature — auth, user, product, cart, order, admin
    <name>/
      model.ts       # drizzle pgTable / pgEnum definitions
      repository.ts  # data access (raw SQL via drizzle)
      service.ts     # business logic
      schema.ts      # zod request validation
      controller.ts  # request/response shaping
      routes.ts      # express router
      index.ts       # barrel
  routes/            # apiRouter aggregating module routers
  services/          # jwt.service.ts, redis.service.ts
  shared/interfaces/ # auth.interface.ts (req.user augmentation)
  utils/             # logger.ts (dev-only console)
tests/               # vitest unit tests (jwt, auth validation, validateBody, order status)
```

## Entrypoints

- `npm run dev` — nodemon + tsx
- `npm run build` — esbuild bundles `app/{server,migrate}.ts`, copies migrations
- `npm run start:prod` — `node ./dist/server.js`
- `npm run migrate` — runs pending migrations via `app/migrate.ts`
- `npm run migrate:create` — `drizzle-kit generate` (snapshot → new SQL file)
- `npm run typecheck` / `npm test`

## API surface

| Method   | Path                            | Auth            |
| -------- | ------------------------------- | --------------- |
| POST     | `/api/auth/register`            | public          |
| POST     | `/api/auth/login`               | public          |
| POST     | `/api/auth/refresh-token`       | public (cookie) |
| POST     | `/api/auth/logout`              | public          |
| GET      | `/api/auth/profile`             | access token    |
| GET      | `/api/auth/admin/dashboard`     | admin           |
| GET      | `/api/users/admin/users`          | admin           |
| GET      | `/api/users/me`                 | access token    |
| PATCH    | `/api/users/me`                 | access token    |
| POST     | `/api/users/change-password`    | access token    |
| GET      | `/api/users/:id`                | admin or self   |
| DELETE   | `/api/users/:id`                | admin           |
| GET      | `/api/products`                 | access token    |
| GET      | `/api/products/:id`             | access token    |
| POST     | `/api/products`                 | access token    |
| PUT      | `/api/products/:id`             | access token    |
| DELETE   | `/api/products/:id`             | access token    |
| GET      | `/api/cart`                     | access token    |
| POST     | `/api/cart/add`                 | access token    |
| POST     | `/api/cart/remove`              | access token    |
| GET      | `/api/orders`                   | access token    |
| POST     | `/api/orders/create`            | access token    |
| GET      | `/api/orders/:id`               | access token    |
| PUT      | `/api/orders/:id/cancel`        | access token    |
| PUT      | `/api/orders/:id/status`        | admin           |
| GET      | `/api/orders/admin/all`         | admin           |
| GET      | `/api/admin/users`              | admin           |
| GET      | `/api/admin/orders`             | admin           |
| PATCH    | `/api/admin/orders/:id/status`  | admin           |
| GET      | `/api/admin/dashboard/stats`    | admin           |
| GET      | `/api/admin/dashboard/users`    | admin           |
| GET      | `/api/health`                   | public          |

## Migrations

Baseline migration `src/db/migrations/0000_*.sql` creates the exact schema the
Prisma-era database already has (tables, enums, unique indexes, FKs). The custom
runner (`app/migrate.ts`) records each file's SHA-256 in `__drizzle_migrations`;
on the pre-seeded database, duplicate-object errors are treated as already-applied
and the file is recorded without touching existing data. Fresh databases get the
full schema.