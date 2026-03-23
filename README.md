# OpenBook

TypeScript monorepo for the OpenBook appointment platform: **NestJS** API + **Vite** React SPA, with `@openbook/shared` (Zod contracts).

The legacy PHP application remains in [`easyappointments-logs/`](./easyappointments-logs/) until features are ported.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- Docker (optional, for MySQL / Redis / Mailpit)

## Setup

```bash
pnpm install
pnpm run build
```

## Development

Terminal 1 — API (http://localhost:3002):

```bash
pnpm --filter @openbook/api dev
```

Terminal 2 — Web (http://localhost:5173, proxies `/api` → API):

```bash
pnpm --filter @openbook/web dev
```

Or run both with Turborepo:

```bash
pnpm dev
```

Ensure `@openbook/shared` is built (`pnpm run build` or build runs automatically via Turbo dependency graph).

### E2E (Playwright)

Requires the API on `http://127.0.0.1:3002` with **`DATABASE_URL` loaded** (e.g. `apps/api/.env`) and a **seeded** database (see below). The Vite dev server proxies `/api` to that port. From `apps/web`:

```bash
pnpm --filter @openbook/web test
```

Without `DATABASE_URL`, login and booking flows will fail while smoke tests still pass. CI runs the same against MySQL, `node dist/src/main.js` for the API, and `vite preview` on port `5174` with `CI=true` (CORS allows `5173` and `5174`). Staff `storageState` logs in as **`admin` / `password`** (provider role cannot call `GET /api/staff/services` with seed RBAC).

### Database (Prisma + MySQL)

1. Start MySQL (e.g. `docker compose up -d`).
2. Create `apps/api/.env` (see [`apps/api/.env.example`](./apps/api/.env.example)) and point it at your instance:

   - `DATABASE_URL=mysql://openbook:openbook@127.0.0.1:3306/openbook` (matches `docker-compose.yml`; use `root` + `openbook` password if you apply schema as root, e.g. `prisma db push`).
   - `JWT_SECRET` — required for auth cookies. For local development, generate with `openssl rand -hex 32` (see comments in `.env.example`).
   - Optionally `OPENBOOK_API_TOKEN` — same pattern for REST v1 (`openssl rand -hex 24`).

3. Apply schema and seed demo data:

   ```bash
   cd apps/api
   pnpm exec prisma migrate deploy
   pnpm exec prisma db seed
   ```

   For a fresh dev DB without migration history yet, `pnpm exec prisma db push` is still acceptable; production should use `migrate deploy` after the baseline under `apps/api/prisma/migrations/`.

   Seeded accounts (password `password`): staff `provider` / `admin`; customer `customer@example.com`.

4. Optional — background jobs (BullMQ + Redis):

   - Set `REDIS_URL` (e.g. `redis://127.0.0.1:6379`) in `apps/api/.env`.
   - After `pnpm run build`, run the worker: `pnpm --filter @openbook/api run worker` (processes queues such as `booking-confirmation`).

5. Optional — Stripe webhooks:

   - Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (Dashboard → webhook signing secret).
   - Endpoint URL: `POST /api/stripe/webhook` (raw body; Nest uses `rawBody: true` for signature verification).
   - Events are stored idempotently in `openbook_stripe_events`.

**Production migrations:** Prefer `pnpm exec prisma migrate deploy` in production (see [docs/roadmap.md](./docs/roadmap.md) Phase H).

### Web routes (UI shell)

| Path | Audience |
|------|----------|
| `/` | Home + API status + public company name from settings |
| `/book` | Public booking wizard (services/providers from API) |
| `/customer/login` | Customer sign in |
| `/customer/bookings` | My bookings (API-backed when logged in) |
| `/staff/login` | Admin / provider / secretary sign in |
| `/staff/dashboard` | Staff dashboard |
| `/staff/settings/*` | Settings sections (general, business, …) |

Anonymous booking: `GET /api/booking/services`, `GET /api/booking/services/:id/providers`, `POST /api/booking/appointments` (guest booking). Staff JSON routes live under `/api/staff/*` (cookie auth). Customer appointments: `GET /api/customer/appointments`. Integrations: `GET /api/v1/ping`, `GET /api/v1/services`, `GET /api/v1/appointments` with `Authorization: Bearer` and `OPENBOOK_API_TOKEN` on the server.

## Local services

```bash
docker compose up -d
```

- MySQL: `localhost:3306` (user/password/db: `openbook` / `openbook` / `openbook`)
- Redis: `localhost:6379`
- Mailpit UI: http://localhost:8025 — SMTP on port `1025`

## Workspace layout

| Path | Description |
|------|-------------|
| `apps/api` | NestJS HTTP API (`/api/*`) |
| `apps/web` | React + Vite SPA |
| `packages/shared` | Shared Zod schemas and types |
| `easyappointments-logs/` | Legacy Easy!Appointments PHP fork |

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/roadmap.md](./docs/roadmap.md) | Phased execution plan and priorities |
| [docs/architecture-decisions.md](./docs/architecture-decisions.md) | Architecture decisions (ADRs) and revisit triggers |
| [docs/route-map.md](./docs/route-map.md) | Legacy PHP → React → Nest route and API traceability |

## License

GPL-3.0 applies to upstream Easy!Appointments-derived code under `easyappointments-logs/`. New TypeScript code in `apps/` and `packages/` is provided under terms you choose for your project (set `license` in each `package.json` as appropriate).
