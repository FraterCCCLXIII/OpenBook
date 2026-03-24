# Legacy PHP → React → Nest route map

See also [architecture-decisions.md](architecture-decisions.md) and [roadmap.md](roadmap.md).

This table tracks parity between the Easy!Appointments fork ([`easyappointments-logs/`](../easyappointments-logs/)) and the new TypeScript stack (`apps/web`, `apps/api`). Update as you port features.

| Legacy PHP path (index.php) | React path | Nest module / API | Notes |
|----------------------------|------------|-------------------|--------|
| `/` (default `booking`) | `/book` | `BookingModule` | Public booking wizard |
| `/customer/login` | `/customer/login` | `AuthModule` + `customer_auth` | Password / OTP modes |
| `/customer/register` | `/customer/register` | `AuthModule` | Optional route |
| `/customer/create_password` | `/customer/create-password` | `AuthModule` | First-time password |
| `/customer/account` | `/customer/account` | `CustomerModule` | Profile |
| `/customer/bookings` | `/customer/bookings` | `CustomerModule` — `GET /api/customer/appointments` | My bookings |
| `/customer/forms` | `/customer/forms` | `FormsModule` | List |
| `/customer/forms/:any` | `/customer/forms/:formId` | `FormsModule` | Single form |
| `/login` + `Login::validate` | `/staff/login` | `AuthModule` + `ea_users` / `ea_user_settings` | Staff JSON login |
| `/dashboard` | `/staff/dashboard` | — | Dashboard shell |
| `/calendar` | `/staff/calendar` | `StaffCalendarController` — `GET/POST/PATCH/DELETE` appointments, blocked periods, unavailabilities; `GET/POST/DELETE /api/staff/calendar/appointments/:id/notes` (+ `.../notes/:noteId`) | FullCalendar: provider/customer/service selects; blocked + unavailability modals; drag/resize updates; appointment modal: internal CRM notes (`ea_appointment_notes`) |
| `/customers` | `/staff/customers` | `GET/POST/PATCH/DELETE /api/staff/customers`; detail includes notes, alerts, custom fields (see Round 3) | CRM list + detail |
| `/services` | `/staff/services` | `GET /api/staff/services` | |
| `/service_categories` | `/staff/service-categories` | `GET /api/staff/service-categories` | |
| `/providers` | `/staff/providers` | `GET/POST/PATCH/DELETE /api/staff/team/provider` + `GET /api/staff/team/provider/:id` | Role directory + CRUD in UI (`users` perm) |
| `/secretaries` | `/staff/secretaries` | `GET/POST/PATCH/DELETE /api/staff/team/secretary` + `GET .../secretary/:id` | List + create/edit/delete forms |
| `/admins` | `/staff/admins` | `GET/POST/PATCH/DELETE /api/staff/team/admin` + `GET .../admin/:id` | List + create/edit/delete forms |
| `/billing` | `/staff/billing` | `GET /api/staff/billing/summary` + Stripe (WIP) | |
| `/logs` | `/staff/logs` | `GET /api/staff/audit-logs` (`openbook_audit_logs`) | Admin (`system_settings`) |
| `/provider/bookings` | `/staff/provider/bookings` | `GET /api/staff/provider/bookings` | Provider role |
| `/provider/bookings/:num` | `/staff/provider/bookings/:id` | Detail | |
| `/general_settings` | `/staff/settings/general` | `SettingsModule` | Admin settings |
| `/business_settings` | `/staff/settings/business` | `SettingsModule` | |
| `/booking_settings` | `/staff/settings/booking` | `SettingsModule` | |
| `/api_settings` | `/staff/settings/api` | `SettingsModule` + Bearer token | |
| `/stripe_settings` | `/staff/settings/stripe` | `SettingsModule` | |
| `/service_area_settings` | `/staff/settings/service-areas` | `SettingsModule` | Fork feature |
| `/ldap_settings` | `/staff/settings/ldap` | `SettingsModule` | |
| `/account` (staff) | `/staff/account` | `StaffAccountController` — `GET/PATCH /api/staff/account` (profile + `working_plan` / `working_plan_exceptions`) | Profile fields, timezone, structured working hours + exceptions JSON, Google Calendar block |
| `/api/v1/*` | Same path prefix | `ApiV1Module` — full CRUD for services, appointments, customers, providers, admins, secretaries, service-categories, unavailabilities, blocked-periods, webhooks, settings, availabilities | REST + Bearer (`OPENBOOK_API_TOKEN`) |

**New screens / APIs added during TypeScript port:**

| Legacy PHP path | React path | Nest module / API | Notes |
|-----------------|------------|-------------------|-------|
| — | `/staff/forms` | `FormsModule` — `GET/POST/PATCH/DELETE /api/staff/forms` | Staff form builder |
| — | `/customer/create-password` | `AuthModule` — `POST /api/auth/customer/create-password` | First-time OTP password |
| — | `/staff/settings/webhooks` | `StaffWebhooksController` — `GET/POST/PATCH/DELETE /api/staff/webhooks` | Outgoing webhooks |
| — | `/staff/billing` | `StaffBillingController` — `GET /api/staff/billing/transactions` | Stripe payment records |
| — | — | `IntegrationsModule` — `GET /api/integrations/google/auth`, `GET /api/integrations/google/callback`, `POST /api/integrations/google/sync` | Google Calendar OAuth |
| — | `/staff/dashboard` | `StaffDashboardController` — `GET /api/staff/dashboard/stats` | Real-time stats |
| — | `/staff/settings/:section` | `SettingsController` — `GET/PATCH /api/staff/settings/section/:section` | Per-section settings |
| — | — | `POST /api/stripe/checkout`; staff refunds `POST /api/staff/billing/refund/:paymentId` | Stripe Checkout; refunds staff-only |
| — | — | `POST /api/auth/customer/request-otp`, `POST /api/auth/customer/verify-otp` | Customer OTP auth |
| — | `/customer/consents` | `CustomerConsentsController` — `GET/POST /api/customer/consents`; `GET /api/settings/legal` — public legal copy | Privacy & consents + expandable T&amp;C / privacy from Legal settings |
| — | `/staff/tools` | `StaffToolsController` — `GET /api/staff/tools/postal-lookup` | GeoNames postal search (`ea_geonames_postal_codes`) |
| — | `/staff/consents-report` | `StaffConsentsController` — `GET /api/staff/consents` | Staff consent audit (`ea_consents`) |
| — | — | `GET /api/auth/csrf-token` | Optional CSRF token (when `OPENBOOK_CSRF_ENABLED`) |
| — | — | `POST /api/staff/system/geonames-import` | Queue GeoNames import stub (BullMQ + worker) |
| — | `/staff/customers/:id` (files) | `GET/POST/DELETE /api/staff/customers/:id/files` | Customer file attachments (`ea_user_files`) |
| — | — | `POST /api/customer/appointments` | Customer books new appointment |
| — | — | `POST /api/staff/customers`, `DELETE /api/staff/customers/:id` | Staff create/delete customer |
| — | — | `PATCH /api/staff/calendar/unavailabilities/:id` | Edit unavailability |
| — | `/staff/webhooks` (sidebar) | `StaffWebhooksController` | Webhooks nav link added |
| — | — | `GET /api/integrations/google/status`, `DELETE /api/integrations/google/disconnect` | Google Calendar status + disconnect |
| — | `/staff/settings/customer-profiles` | `StaffSettingsController` — `GET/PATCH /api/staff/settings/section/customer-profiles` (`customerProfilesSettingsSchema`) | Customer profile required-field flags |
| — | `/staff/settings/service-areas` | `StaffSettingsController` — `GET/PATCH .../section/service-areas` (`serviceAreasSettingsSchema`) | Service area countries + notes |
| — | `/staff/settings/ldap` | `SettingsController` | LDAP full field set (ldap_is_active, ldap_username, ldap_password, ldap_base_dn) |
| — | `/staff/settings/analytics` | `SettingsController` | Matomo analytics fields (matomo_analytics_active, url, site_id) |

**Round 3 additions (schema + auth + UI parity):**

| Legacy PHP path | React path | Nest module / API | Notes |
|-----------------|------------|-------------------|-------|
| — | `/customer/bookings/:id` (edit) | `PATCH /api/customer/appointments/:id`; `GET` includes payment summary + `canPayWithStripe` | Edit startDatetime / notes, re-validates slot; **Pay with Stripe** when service has price and payment not succeeded |
| — | `/staff/providers/:id` | `GET /api/staff/providers/:id` | Provider detail (working plan, timezone, services) |
| — | `/staff/providers/:id` | `PATCH /api/staff/providers/:id` | Update provider working plan / timezone / service assignments |
| — | `/staff/customers` (modal) | `PATCH /api/staff/customers/:id` | Inline edit on list; full profile on detail |
| `geonames_postal_codes` | `/staff/tools` | Prisma model `GeoNamesPostalCode` → `ea_geonames_postal_codes`; `GET /api/staff/tools/postal-lookup` | Staff postal lookup |
| `appointment_notes` | `/staff/calendar` (appointment modal) | `GET/POST/DELETE /api/staff/calendar/appointments/:id/notes` | Per-appointment internal notes in staff calendar edit modal |
| `customer_notes` | `/staff/customers/:id` | `GET` detail includes notes; `POST /api/staff/customers/:id/notes`, `DELETE .../notes/:noteId` | Staff customer detail |
| `customer_alerts` | `/staff/customers/:id` | `GET` detail includes alerts; `POST .../alerts`, `PATCH .../alerts/:alertId`, `DELETE .../alerts/:alertId` | Staff customer detail |
| `custom_fields` | `/staff/customers/:id` | `GET` detail includes active fields + values; `PATCH /api/staff/customers/:id/custom-fields` | Staff customer detail |
| `customer_custom_field_values` | — | (persisted via `PATCH .../custom-fields`) | Values per customer |
| `user_files` | `/staff/customers/:id` | Prisma model `UserFile` → `ea_user_files`; `GET/POST/DELETE .../files` | Customer file attachments |
| `ea_consents` | — | Prisma model `Consent` now has `id_users` FK | Better consent tracking without email lookup |
| `ldap_*` settings | `/staff/settings/ldap` | `AuthService.ldapBind()` — `staffLogin` LDAP auth path | LDAP bind via `ldapjs`; falls back to bcrypt on failure |
| — | — | Email templates `booking-customer.html` / `booking-provider.html` | File-based `{{VARIABLE}}` templates for booking confirmation emails |

**Anonymous booking (no auth):** `GET /api/booking/services`, `GET /api/booking/services/:serviceId/providers`, `POST /api/booking/available-hours`, `POST /api/booking/unavailable-dates`, `POST /api/booking/appointments`. **Stripe:** `POST /api/stripe/webhook` (configure `STRIPE_*` env). **Queue health (staff admin):** `GET /api/staff/system/queue`; background worker: `pnpm --filter @openbook/api run worker` when `REDIS_URL` is set.

**Blocked on** column (for planning): most staff/customer pages require **Prisma + MySQL**, **JWT/session auth**, and **RBAC** from `ea_roles` permission integers.
