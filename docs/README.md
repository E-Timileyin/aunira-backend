# Aunira Backend — Docs

| Doc | Contents |
| --- | --- |
| [architecture.md](./architecture.md) | Stack, layers, module map, dependency rules, entrypoints |
| [design-patterns.md](./design-patterns.md) | Patterns in use, where they live, what they cost |
| [data-flow.md](./data-flow.md) | Request lifecycle, auth flow, checkout flow, data model |

Quick orientation: feature-first modular monolith. Express at the edge, services hold the rules, repositories own SQL, Drizzle owns the types.

## Stack

| Layer | Choice |
| --- | --- |
| Runtime | Node 24, ESM |
| HTTP | Express 5 |
| DB | PostgreSQL (Neon) via `pg` Pool + Drizzle |
| Cache | Redis (ioredis) — refresh-token store |
| Auth | JWT access (15m) + rotating refresh (7d), bcrypt |
| Validation | zod at the request edge |
| Build | esbuild for prod, tsx for dev and migrations |
| Tests | vitest |

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
