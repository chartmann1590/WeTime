# Repository Guidelines

## Project Structure & Module Organization
- `apps/frontend` – Next.js web UI (`src`, `public`).
- `apps/backend` – Next.js API/middleware on port 3001 (`src`).
- `apps/worker` – Node service for scheduled jobs (`src`).
- `packages/*` – Shared libs (reserved; add new packages here).
- `prisma/` – Prisma schema (`schema.prisma`).
- `deploy/` – Nginx image and config.
- `docker-compose.yml` – Full stack: Postgres, backend, frontend, worker, nginx.

## Build, Test, and Development Commands
- Install: `pnpm install` (Node >= 18). Workspace is managed via `pnpm`.
- Dev (all apps): `pnpm dev` (frontend 3000, backend 3001).
- Build: `pnpm build` (builds all `apps/*`).
- Start: `pnpm start` (runs built apps).
- Lint: `pnpm lint` (Next ESLint).
- Docker stack: `docker compose up --build` (includes Postgres & nginx).
- Prisma: after schema changes
  - `cd apps/backend && npx prisma generate`
  - `npx prisma migrate dev` (requires `DATABASE_URL`).

## Coding Style & Naming Conventions
- TypeScript strict; prefer 2-space indentation.
- React 18 functional components; Next.js 14 app/router conventions.
- Use path alias `@/*` for code under `src/*`.
- Names: PascalCase for components/types; camelCase for variables/functions; keep route segments lowercase/kebab-case.
- Keep changes scoped to the relevant app; avoid cross-app imports outside `packages/*`.

## Testing Guidelines
- No global test runner is configured yet. If adding tests:
  - Prefer Jest/Testing Library for Next apps; Vitest acceptable if consistent.
  - Name files `*.test.ts(x)` alongside sources or in `__tests__/`.
  - Keep unit tests fast; add e2e separately (e.g., Playwright).

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
  - Example: `feat(backend): add RSVP endpoint`
- PRs should include: clear description, linked issues, screenshots (UI), steps to reproduce/test, and notes on migrations if Prisma changed.

## Security & Configuration
- Copy `.env.example` to `.env`; never commit secrets.
- Required vars: `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `DEFAULT_TIMEZONE`, `INTERNAL_CRON_TOKEN`.
- For local DB: `docker compose up -d db` then run Prisma migrations.

## Agent-Specific Instructions
- Do not rename top-level folders; follow `apps/*` and `packages/*` layout.
- If modifying data models, update `prisma/` and run/generate Prisma accordingly.
- Keep unrelated apps untouched; update docs and scripts when adding a new package or app.

