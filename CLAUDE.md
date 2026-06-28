# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Volunteer-registration web app for the Startzondag of Gereformeerde Kerk Ermelo. Volunteers sign up for tasks (each with a limited number of slots); admins manage tasks and registrations. The domain language and all user-facing copy are **Dutch** — keep new strings, error messages, and commit-facing UI text in Dutch.

Domain vocabulary: `Taak` = task, `Aanmelding` = registration/sign-up, `vrijwilliger` = volunteer, `wijzig` = edit, `bevestiging` = confirmation, `maxAantal` = slot count.

## Commands

```bash
npm run dev              # Dev server on :3000
npm run build            # prisma generate && next build
npm run lint             # next lint (eslint)
npm run type-check       # tsc --noEmit
npm test                 # Jest (jsdom) — runs on every commit via husky pre-commit hook
npm run test:watch
npm run test:coverage
npm run test:unit        # Jest under __tests__
npm run test:integration # Jest under __tests__/api
npm run test:e2e         # Playwright (e2e/ dir, 5 browser projects, auto-starts dev server locally)
npm run test:e2e:ui
npm run quality:check    # lint + type-check + test — run this before considering work done
npm run quality:fix      # lint --fix

# Run a single Jest test
npx jest path/to/file.test.ts
npx jest -t "name of the test"

# Database (Prisma)
npm run db:push          # prisma db push (no migration files — schema is pushed directly)
npm run db:studio        # Prisma Studio
npm run seed             # tsx scripts/seed.ts (seeds admin)
npm run seed:tasks       # tsx scripts/seed-tasks.ts
```

Note: this project uses Prisma `db push` (schema-sync), **not** migration files. There is no `prisma/migrations/` directory; change `prisma/schema.prisma` then `npm run db:push`. The Vercel build runs `prisma generate && prisma db push && next build`.

## Architecture

Next.js 15.4 **App Router** + TypeScript (strict) + Prisma/PostgreSQL + Tailwind. Path alias `@/*` maps to the repo root (e.g. `@/lib/db`).

### Layout
- `app/` — routes. Public: `/` (task overview), `/aanmelden/[id]` (sign up for a task), `/bevestiging`, `/wijzig/[token]` (self-service edit/cancel via unique token). Admin: `/admin/login`, `/admin/dashboard/*`. API under `app/api/`, admin API under `app/api/admin/`.
- `lib/` — shared logic: `db.ts`, `auth.ts`, `email.ts`, `validation.ts`, `rate-limit.ts`.
- `components/` — React components (e.g. `TaakCard`).
- `prisma/schema.prisma` — three models: `Taak`, `Aanmelding`, `Admin`.

### Auth flow (important)
- Admin login (`POST /api/admin/login`) verifies a bcrypt password against the `Admin` table, then issues a JWT (4h expiry) stored in an httpOnly cookie named `auth-token`. Helpers live in `lib/auth.ts` (`createToken`, `verifyToken`, `getSession`, `setSession`, `clearSession`).
- `middleware.ts` only guards `/admin/*` (except `/admin/login`) and only checks that the `auth-token` cookie **exists** — it does not verify the JWT. Server-side route handlers/pages must call `getSession()`/`verifyToken()` for real authorization. Don't assume the middleware authenticated the request.
- First-login bootstrap: `/api/admin/login` auto-creates the `Admin` row from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars if none exists for that username.

### Registration flow
Each `Aanmelding` gets a unique `token`; the self-service edit/cancel page `/wijzig/[token]` and `app/api/wijzig/[token]/route.ts` use it instead of an account. Slot availability is computed as `maxAantal - count(aanmeldingen)` and must be re-checked server-side on POST. Dutch phone validation lives in `lib/validation.ts` (`validateDutchPhoneNumber`).

### Prisma client (`lib/db.ts`)
Singleton on `globalThis.prisma` to survive HMR/serverless. Conditionally applies the `withAccelerate` extension only when `DATABASE_URL` contains `prisma.io`. Import the shared `prisma` from `@/lib/db`; never construct a new `PrismaClient`.

### Email (`lib/email.ts`)
Resend API with exponential-backoff retry (3 attempts). The app is designed to run **without** email configured — sending failures should not break registration. `from` address comes from `EMAIL_FROM`.

### Rate limiting (`lib/rate-limit.ts`)
In-memory `Map` keyed by identifier (e.g. IP). This is per-instance and resets on cold start — adequate for this single-region deploy, not a distributed limiter.

## Deployment & environments

Hosted on **Vercel** (region `fra1`), config in `vercel.json` (admin API routes get 60s timeout, others 30s; security headers set there). Deploys are GitLab/GitHub-triggered.

**OTAP workflow** (see `docs/OTAP-WORKFLOW.md`): branches map to environments — `develop` (O), `test` (T), `staging` (A/acceptance), `main` (P/production → `gke-startzondag.nl`). There are matching `.env.<environment>` files. **`main` is production** — treat it accordingly.

## Conventions

- Coverage thresholds (`quality-metrics.config.js`): 80% statements/functions/lines, 75% branches (relaxed per-environment for dev/test). Don't drop coverage below these.
- Per the global rules, secrets belong in 1Password, never in `.env`. Several `.env.*.local` and historical files exist in this repo and there are docs about removing secrets from git history (`REMOVE_SECRETS_FROM_GIT_HISTORY.md`) — if you encounter plaintext secrets, flag them rather than committing more.
- `docs/CLAUDE.md` is the original product/design spec (Dutch), useful for intent but not an operational guide; this file is the operational reference.
