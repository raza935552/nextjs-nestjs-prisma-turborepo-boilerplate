Next.js + NestJS + Prisma Boilerplate

Overview
- Web: Next.js 15 app (apps/web)
- API: NestJS 11 + Fastify + Prisma (apps/api)
- DB: PostgreSQL via Prisma Client
- Logging: Pino (API)

Quick Start
1) Install
- pnpm i

2) Configure env
- API: apps/api/.env
  - HOST, PORT, ALLOW_CORS_URL
  - ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET
  - DATABASE_URL=postgres://user:pass@localhost:5432/db
  - Optional MAIL_* — if not set, emails are logged (dev-friendly fallback)
- Web: apps/web/.env.local
  - API_URL=http://localhost:3001
  - AUTH_URL=http://localhost:3000
  - AUTH_SECRET=your-secret
  - AUTH_SESSION_AGE=2592000

3) Prisma
- cd apps/api && pnpm prisma:generate
- If starting a new DB: pnpm prisma:migrate
- Seed demo data: pnpm prisma:seed (creates demo user demo@example.com / P@ssw0rd!)
- Reset dev DB: pnpm prisma:reset

4) Run
- API: pnpm dev --filter=api
- Web: pnpm dev --filter=web

5) Docker (local services)
- Start local Postgres + MailHog + pgAdmin: `docker compose up -d`
- Stop: `docker compose down`
- Mail UI: http://localhost:8025 (SMTP on 1025)
- pgAdmin: http://localhost:5050 (email: admin@local, password: admin)
- Example API DATABASE_URL for Docker DB:
  - `postgresql://postgres:postgres@localhost:5432/app`

Key API Routes
- POST /auth/sign-up
- POST /auth/sign-in
- POST /auth/sign-out
- POST /auth/sign-out-allDevices
- PATCH /auth/confirm-email
- PATCH /auth/forgot-password
- PATCH /auth/reset-password
- PATCH /auth/change-password
- PATCH /auth/refresh-token (Requires refresh token in Authorization header)
- GET /auth/sessions/:userId
- GET /auth/session/:id
- GET /users
- GET /users/:username

OpenAPI + Postman
- Swagger UI: http://localhost:3001/api-docs (non-production)
- Raw OpenAPI JSON: http://localhost:3001/openapi.json
- Postman import: In Postman, Import → Link → paste the /openapi.json URL, or download and import the file.

Notes
- Prisma models map to lowercase DB tables (user, profile, session, otp).
- Email sending falls back to logging if MAIL_* env is not configured.
- Swagger is enabled in non-production.
- Health checks at /health (database, disk, memory). Database check uses Prisma ping.
- Rate limits: sensitive auth endpoints are limited (5 req/min) via Throttler.
- All responses include x-request-id; errors return a uniform envelope.
- CI: GitHub Actions workflow builds API and Web on PR/commits to main.
- Web security headers: CSP, HSTS, and other headers are set in next.config.ts.
