# Architecture decisions

Living document. Record significant choices, the reasoning, and conditions under which we'd revisit.

---

## ADR-001: NestJS as the API framework

**Status:** Accepted (revisit after PHP migration is complete)

**Context:**
OpenBook is a TypeScript monorepo (React SPA + Nest API + shared Zod package) migrating from a PHP Easy!Appointments fork. The team is small. We evaluated NestJS against lighter alternatives (Express, Fastify, Hono, tRPC).

**Decision:** Keep NestJS for now, but write code that stays portable.

**Rationale:**
- Nest is already in place with working auth, availability, settings, and staff list APIs.
- Switching mid-migration from PHP would be a distraction with no user-facing benefit.
- The community is large, docs are comprehensive, and LLMs generate idiomatic Nest reliably — all helpful for a small team iterating fast.

**Known trade-offs (from real-world community feedback):**
- **Boilerplate.** Every endpoint needs a controller + module registration. For a solo dev, `app.get('/path', handler)` in Hono/Express is faster to iterate on.
- **No native ESM.** Nest is CJS-only. Some newer libraries are ESM-only and require workarounds. Node 20+ interop mitigates this for now.
- **Decorator type-safety gap.** `@Body() dto: SomeDto` has no compile-time link to the actual runtime validation. Zod-first frameworks (Hono, tRPC) close this gap automatically.
- **Boot time.** DI container initialization adds ~100ms. Irrelevant for a long-running server; matters if we ever target serverless/edge.

**Guardrails (so switching stays cheap):**
1. **Services are plain classes.** They take `PrismaService`, return data. No `ExecutionContext`, `Reflector`, or other Nest types in business logic.
2. **Controllers are thin.** Parse request → call service → return JSON. If a method exceeds ~10 lines of logic, move it to the service.
3. **Avoid deep Nest-isms.** No interceptors, custom pipes, dynamic modules, or `APP_GUARD` provider tokens unless there's a concrete need. The simpler our Nest usage, the cheaper a future move.
4. **Shared contracts in `@openbook/shared`.** Zod schemas live there, not in Nest DTOs.

**Migration paths if we outgrow Nest:**
- **Hono or Express + existing services** — ~1-2 days of rewiring given current codebase size; business logic unchanged.
- **tRPC** — end-to-end type safety between React and API; eliminates the DTO/validation disconnect.
- **Next.js Route Handlers** — only if we also want SSR for public pages; would replace both Vite and Nest.

**Revisit when:**
- PHP migration is done and we know the app's real scale/deployment needs.
- ESM-only dependencies become a recurring friction point.
- The team grows and we need stronger compile-time API contracts (tRPC signal).
- We want serverless/edge deployment where boot time matters.

---

## ADR-002: Prisma as the ORM (pinned to 5.x)

**Status:** Accepted

**Context:**
The legacy PHP app uses raw MySQL queries against `ea_*` tables. We need typed DB access in TypeScript.

**Decision:** Use Prisma with `@map` / `@@map` to match the existing `ea_` table/column names.

**Rationale:**
- Prisma generates a typed client from the schema, catching column mismatches at compile time.
- `db push` + seed works well for dev/CI without a full migration history from PHP.
- The schema maps cleanly to Easy!Appointments tables with `@@map("ea_*")`.

**Trade-offs:**
- Pinned to Prisma **5.22.0** because v7 dropped `url` in `datasource` (requires `prisma.config.ts` + adapter pattern). Revisit when v7 stabilizes or we need its features.
- Prisma can be verbose for complex queries (raw SQL escape hatch available).

**Revisit when:**
- Prisma 7 adapter pattern is stable and we want edge/serverless.
- Query complexity outgrows the Prisma client (consider Drizzle or Kysely for specific modules).

---

## ADR-003: Vite + React SPA (not Next.js / Nuxt)

**Status:** Accepted

**Context:**
The app is primarily a logged-in SPA (staff backend, customer portal). Public pages (home, booking wizard) don't need SEO-critical server rendering today.

**Decision:** Vite dev server + React SPA, proxying `/api` to Nest.

**Rationale:**
- Instant HMR, simple config, no server rendering complexity.
- Clean separation: UI is static JS; API is HTTP JSON. Easy to reason about, deploy independently.
- Next.js adds value mainly for SSR/SEO and server actions — neither is a current need.

**Trade-offs:**
- No server-side rendering. If public booking pages need SEO (Google indexing appointment types, for example), we'd need to add SSR or a static pre-render step.
- Two deployables (Vite build + Nest server) vs one (Next.js).

**Revisit when:**
- SEO becomes a product requirement for public pages.
- We want server components or server actions for data loading patterns.

---

## ADR-004: CSRF and the React SPA

**Status:** Accepted (revisit if legacy form POST compatibility is required)

**Context:** Easy!Appointments PHP used session cookies and CSRF tokens for many POSTs. OpenBook uses a Vite SPA with JSON APIs; staff and customer sessions use HTTP-only cookies plus JWT-backed guards.

**Decision:** Do not implement PHP-style CSRF tokens for the SPA API by default. Rely on same-site cookie semantics, CORS allowlists, and Bearer tokens for machine clients (`OPENBOOK_API_TOKEN`, customer/staff JWT).

**Rationale:** Duplicate CSRF middleware adds complexity with little benefit when APIs are JSON-only and not embedded in third-party origin forms.

**Revisit when:** A documented requirement exists to accept legacy browser POSTs or embedded widgets that cannot send custom headers.

---

*Add new ADRs below as decisions arise. Format: number, title, status, context, decision, rationale, trade-offs, revisit triggers.*

---

## Related planning docs

| Doc | Purpose |
|-----|---------|
| [roadmap.md](./roadmap.md) | Execution phases, priorities, and suggested order |
| [route-map.md](./route-map.md) | Legacy PHP path → React route → Nest module / API parity |
