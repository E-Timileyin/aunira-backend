# Aunira Backend

REST API for a storefront: accounts, product catalog, cart, and orders.

Express 5 and TypeScript on PostgreSQL, with Drizzle as the query layer and
Redis backing rotating refresh tokens. Requests are validated with zod at the
edge; every module is layered `routes → controller → service → repository → model`.

## Docs

| Doc | Contents |
| --- | --- |
| [docs/architecture.md](./docs/architecture.md) | Stack, layers, module map, dependency rules, entrypoints |
| [docs/design-patterns.md](./docs/design-patterns.md) | Patterns in use, where they live, what they cost |
| [docs/data-flow.md](./docs/data-flow.md) | Request lifecycle, auth flow, checkout flow, data model |
| [STRUCTURE.md](./STRUCTURE.md) | Directory layout and full API surface |

## Quick start

```bash
cp .env.example .env    # fill in DATABASE_URL, REDIS_URL, JWT_SECRET, REFRESH_TOKEN_SECRET
npm install
npm run migrate
npm run dev
```

The server refuses to boot without `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and
`REFRESH_TOKEN_SECRET` — `src/config/env.ts` validates them at import time.
`GET /api/health` reports database connectivity.

## Commands

```
npm run dev            # nodemon + tsx
npm run build          # esbuild -> dist/, copies migrations
npm run start:prod     # node ./dist/server.js
npm run migrate        # apply pending migrations
npm run migrate:create # drizzle-kit generate from model changes
npm run typecheck      # tsc --noEmit
npm test               # vitest run
```

## Layout

```
app/          entrypoints: server.ts, migrate.ts
src/config    env validation, jwt/redis/server config
src/db        pool, drizzle client, models aggregate, migrations
src/modules   one folder per domain: auth, user, product, cart, order, admin
src/routes    apiRouter assembling module routers
src/services  jwt, redis
tests/        vitest unit tests
```

New here? Read [docs/architecture.md](./docs/architecture.md) first, then
[docs/data-flow.md](./docs/data-flow.md) for the request and checkout paths.
