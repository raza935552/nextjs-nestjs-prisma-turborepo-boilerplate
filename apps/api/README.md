API Boilerplate (NestJS + Fastify + Prisma + PostgreSQL)

Overview
- NestJS 11 with Fastify adapter and Pino logging
- Prisma ORM with PostgreSQL (`DATABASE_URL`)
- Auth (JWT access/refresh), sessions, users, profiles
- Mailer module placeholder

Getting Started
1) Set environment
- Copy `.env` and update values as needed:
  - `HOST`, `PORT`, `ALLOW_CORS_URL`
  - `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`
  - `DATABASE_URL` (e.g. postgres://user:pass@localhost:5432/db)

2) Install and generate Prisma client
- From repo root: `pnpm i`
- `cd apps/api && pnpm prisma:generate`

3) Database
- If starting clean: `pnpm prisma:migrate` (creates tables from schema)
- Seed demo data: `pnpm prisma:seed` (demo@example.com / P@ssw0rd!)
- Reset dev DB: `pnpm prisma:reset`
- If using an existing DB, adjust model mappings in `prisma/schema.prisma` and run `pnpm prisma:generate`

4) Run
- Dev: `pnpm dev --filter=api`
- Build: `pnpm build --filter=api`
- Start: `pnpm start --filter=api`

Project Structure
- `src/database` — Prisma service and transaction helper
- `src/features/auth` — auth controller/service (JWT + sessions)
- `src/features/users` — users controller/service
- `prisma/schema.prisma` — models mapped to lowercase tables

Health & Resilience
- `/health` with database, disk, and memory checks (Prisma-based DB ping)
- Per-route throttling for sensitive auth endpoints (5 req/min)
- Global request ID (x-request-id) and structured error responses

OpenAPI & Postman
- Swagger UI at `/api-docs` (non-production)
- Raw OpenAPI JSON at `/openapi.json`
- Import into Postman: open Postman → Import → Link → paste `/openapi.json` URL (or download and import)

