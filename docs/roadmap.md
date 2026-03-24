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

In place: Prisma + MySQL (including `openbook_*` tables), JWT auth (staff + customer), `AvailabilityService` + public booking (`POST /api/booking/appointments`), customer register/profile/appointments, staff calendar (FullCalendar with provider/customer/service pickers, blocked and unavailability CRUD, drag/move/resize for appointments and unavailabilities), CRM detail (profile + address fields, customer notes, alerts, custom fields), services CRUD, provider/secretary/admin team CRUD in the staff UI (`users` permission), provider booking detail, staff account working plan + Google Calendar link, per-section settings validated with `@openbook/shared` Zod (including `customer-profiles` and `service-areas`), LDAP setting keys aligned with `AuthService.ldapBind`, Stripe webhook idempotency + BullMQ job enqueue (Redis optional), REST v1 `services` / `appointments`, seed data, CI.

**Remaining polish:** Deeper Stripe/billing parity vs PHP fork (receipts, partial refunds) as needed; full GeoNames CSV import pipeline; LDAP user import modal.

**Recently closed (parity / UX):** Optional **CSRF** (`OPENBOOK_CSRF_ENABLED` + `VITE_OPENBOOK_CSRF`, `GET /api/auth/csrf-token`, ADR-005). **GeoNames** staff tools + postal lookup API; **UserFile** uploads on customer detail; **consents** staff report + customer page legal panels from `GET /api/settings/legal`; **LDAP** search filter + field-mapping settings + richer bind; **billing** summary counts (pending/refunded); **jobs** `geonames-import` stub; **customer bookings** multi-attendant overlap check; **Stripe** customer refund route removed (staff refunds only).

---

## Phase A — Public app (done / maintenance)

**Goal:** Home and `/book` feel real: company info, selectable service and provider, DB-backed slots.

**Status:** [`HomePage`](../apps/web/src/pages/HomePage.tsx) uses `GET /api/settings/public`. [`BookWizard`](../apps/web/src/components/BookWizard.tsx) loads services and providers from `GET /api/booking/services` and `GET /api/booking/services/:serviceId/providers` and uses `POST /api/booking/available-hours` / `unavailable-dates`. Treat further work here as UX polish (copy, empty states, performance), not blockers.

**Exit (met):** Anonymous user can complete service → provider → date → time without hardcoded IDs.

---

## Phase B — Customer parity

**Goal:** Customer routes backed by Nest, scoped to JWT `customerId`.

- Customer appointments API (list/detail scoped to customer user).
- Forms / register / OTP per [`route-map.md`](./route-map.md) once schema and PHP behavior are clear.

**Exit:** Logged-in customer sees “My bookings” from the API.

---

## Phase C — Staff calendar and CRM

**Goal:** Replace staff placeholders with real data and editing.

**Status:** Calendar and CRM list/detail flows are implemented; staff calendar supports `ea_appointment_notes`. Optional follow-ups: GeoNames staff UI, `UserFile` attachments, deeper PHP calendar edge cases (overlap warnings, large customer lists → typeahead).

- Provider bookings route for provider role (see [`route-map.md`](./route-map.md)).

---

## Phase D — Settings cluster

**Goal:** Sub-routes under `/staff/settings/*` matching PHP (general, business, booking, API, Stripe, LDAP, …).

**Status:** Section `GET`/`PATCH` with Zod in `@openbook/shared`; secrets excluded from `GET /api/settings/public` via `SECRET_SETTING_KEYS`. Remaining: any missing legacy keys, richer LDAP/field-mapping UI vs PHP.

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

1. Phase B refinements and Phase E (billing) as product needs  
2. Partial Phase G (auth E2E once seed users are stable)  
3. Phase F and full Phase G in parallel with hardening  
4. Phase H ongoing  

Stack and migration decisions are **not** revisited here — see [architecture-decisions.md](./architecture-decisions.md).
