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

## License

GPL-3.0 applies to upstream Easy!Appointments-derived code under `easyappointments-logs/`. New TypeScript code in `apps/` and `packages/` is provided under terms you choose for your project (set `license` in each `package.json` as appropriate).
