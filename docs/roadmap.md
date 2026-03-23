# OpenBook roadmap

Execution plan for parity with the Easy!Appointments PHP fork (`easyappointments-logs/`). Update phases as work completes.

## Documentation index

| Doc | Purpose |
|-----|---------|
| [architecture-decisions.md](./architecture-decisions.md) | ADRs: Nest, Prisma, Vite — rationale, guardrails, when to revisit |
| [route-map.md](./route-map.md) | Legacy PHP path → React route → Nest module / API |
| This file | Phased priorities and suggested order |

Architecture constraints (stack choices) live in **architecture-decisions.md**; route-level traceability lives in **route-map.md**.

---

## Foundation (current)

In place: Prisma + MySQL (including `openbook_*` tables), JWT auth (staff + customer), `AvailabilityService` + public booking (`POST /api/booking/appointments`), customer register/profile/appointments, staff calendar (FullCalendar), CRM detail, services CRUD, provider booking detail, staff account working plan, Stripe webhook idempotency + BullMQ job enqueue (Redis optional), REST v1 `services` / `appointments`, seed data, CI.

**Remaining polish:** Stripe Checkout/refunds UI parity, optional CSRF for legacy POST compatibility (see [architecture-decisions.md](./architecture-decisions.md)). Playwright: staff + customer `storageState` setups, anonymous booking happy path, authenticated customer bookings (`apps/web/e2e/`).

---

## Phase A — Public app (highest ROI)

**Goal:** Home and `/book` feel real: company info, selectable service and provider, DB-backed slots.

- Surface `GET /api/settings/public` on [`HomePage`](../apps/web/src/pages/HomePage.tsx) / public layout.
- Add **anonymous** booking metadata APIs (e.g. list services and providers for a service) backed by Prisma + `ea_services_providers`.
- Update [`BookWizard`](../apps/web/src/components/BookWizard.tsx) to load those lists instead of hardcoded IDs; keep `POST /api/booking/available-hours` / `unavailable-dates`.

**Exit:** Anonymous user completes service → provider → date → time without manual IDs.

---

## Phase B — Customer parity

**Goal:** Customer routes backed by Nest, scoped to JWT `customerId`.

- Customer appointments API (list/detail scoped to customer user).
- Forms / register / OTP per [`route-map.md`](./route-map.md) once schema and PHP behavior are clear.

**Exit:** Logged-in customer sees “My bookings” from the API.

---

## Phase C — Staff calendar and CRM

**Goal:** Replace staff placeholders with real data and editing.

- Calendar module + UI (FullCalendar or equivalent); align with backend events API.
- Wire staff list pages to detail + create/update where RBAC allows.
- Users CRUD (providers, secretaries, admins) with `users` permission.
- Provider bookings route for provider role.

---

## Phase D — Settings cluster

**Goal:** Sub-routes under `/staff/settings/*` matching PHP (general, business, booking, API, Stripe, LDAP, …).

- Extend settings APIs: validation per section; never expose secrets on public endpoints.

---

## Phase E — Billing and integrations

- Billing + Stripe (webhooks, refunds) as in PHP fork.
- Logs / audit.
- Async jobs (Redis, queue) for email, sync, GeoNames, etc.

---

## Phase F — Availability hardening

- Multi-attendant parity with PHP `Availability::consider_multiple_attendants` if product requires it.
- Extra tests (fixtures / MySQL in CI) for edge cases.
- CSRF alignment if SPA POSTs must match PHP semantics.

---

## Phase G — Playwright depth

- `globalSetup`: staff + customer login → `storageState`.
- Separate test projects per role; assert booking slot count and authenticated shell routes.

---

## Phase H — Ops and docs

- Keep [`README.md`](../README.md) env and setup accurate.
- Prefer `prisma migrate deploy` in production once migration history is baselined.
- Update [`route-map.md`](./route-map.md) for every new screen or API.

---

## Suggested order

1. Phase A (public booking UX)  
2. Partial Phase G (auth E2E once seed users are stable)  
3. Phase B → C → D → E  
4. Phase F and full Phase G in parallel with hardening  

Stack and migration decisions are **not** revisited here — see [architecture-decisions.md](./architecture-decisions.md).
