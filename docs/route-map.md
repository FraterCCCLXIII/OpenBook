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
| `/calendar` | `/staff/calendar` | `StaffModule` — `GET /api/staff/calendar/appointments` | FullCalendar UI |
| `/customers` | `/staff/customers` | `GET /api/staff/customers` | CRM list |
| `/services` | `/staff/services` | `GET /api/staff/services` | |
| `/service_categories` | `/staff/service-categories` | `GET /api/staff/service-categories` | |
| `/providers` | `/staff/providers` | `GET/POST/PATCH/DELETE /api/staff/team/provider` | Role directory + CRUD (`users` perm) |
| `/secretaries` | `/staff/secretaries` | `GET/POST/PATCH/DELETE /api/staff/team/secretary` | |
| `/admins` | `/staff/admins` | `GET/POST/PATCH/DELETE /api/staff/team/admin` | |
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
| `/account` (staff) | `/staff/account` | `UserModule` | User profile + availability |
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
| — | — | `POST /api/stripe/checkout`, `POST /api/stripe/refund` | Stripe Checkout + refunds |
| — | — | `POST /api/auth/customer/request-otp`, `POST /api/auth/customer/verify-otp` | Customer OTP auth |
| — | `/customer/consents` | `CustomerConsentsController` — `GET/POST /api/customer/consents` | Privacy & consents |
| — | — | `POST /api/customer/appointments` | Customer books new appointment |
| — | — | `POST /api/staff/customers`, `DELETE /api/staff/customers/:id` | Staff create/delete customer |
| — | — | `PATCH /api/staff/calendar/unavailabilities/:id` | Edit unavailability |
| — | `/staff/webhooks` (sidebar) | `StaffWebhooksController` | Webhooks nav link added |
| — | — | `GET /api/integrations/google/status`, `DELETE /api/integrations/google/disconnect` | Google Calendar status + disconnect |
| — | `/staff/settings/customer-profiles` | `SettingsController` | Customer profile required-field flags |
| — | `/staff/settings/service-areas` | `SettingsController` | Service area countries + notes |
| — | `/staff/settings/ldap` | `SettingsController` | LDAP full field set (ldap_is_active, ldap_username, ldap_password, ldap_base_dn) |
| — | `/staff/settings/analytics` | `SettingsController` | Matomo analytics fields (matomo_analytics_active, url, site_id) |

**Round 3 additions (schema + auth + UI parity):**

| Legacy PHP path | React path | Nest module / API | Notes |
|-----------------|------------|-------------------|-------|
| — | `/customer/bookings/:id` (edit) | `PATCH /api/customer/appointments/:id` | Edit startDatetime / notes, re-validates slot |
| — | `/staff/providers/:id` | `GET /api/staff/providers/:id` | Provider detail (working plan, timezone, services) |
| — | `/staff/providers/:id` | `PATCH /api/staff/providers/:id` | Update provider working plan / timezone / service assignments |
| — | `/staff/customers` (modal) | `PATCH /api/staff/customers/:id` | Inline edit customer name/email |
| `geonames_postal_codes` | — | Prisma model `GeoNamesPostalCode` → `ea_geonames_postal_codes` | Postal code lookup |
| `appointment_notes` | — | Prisma model `AppointmentNote` → `ea_appointment_notes` | Per-appointment notes with author FK |
| `customer_notes` | — | Prisma model `CustomerNote` → `ea_customer_notes` | Per-customer notes |
| `customer_alerts` | — | Prisma model `CustomerAlert` → `ea_customer_alerts` | Per-customer alert messages |
| `custom_fields` | — | Prisma model `CustomField` → `ea_custom_fields` | Dynamic customer custom fields |
| `customer_custom_field_values` | — | Prisma model `CustomerCustomFieldValue` → `ea_customer_custom_field_values` | Custom field values per customer |
| `user_files` | — | Prisma model `UserFile` → `ea_user_files` | User file attachments |
| `ea_consents` | — | Prisma model `Consent` now has `id_users` FK | Better consent tracking without email lookup |
| `ldap_*` settings | `/staff/settings/ldap` | `AuthService.ldapBind()` — `staffLogin` LDAP auth path | LDAP bind via `ldapjs`; falls back to bcrypt on failure |
| — | — | Email templates `booking-customer.html` / `booking-provider.html` | File-based `{{VARIABLE}}` templates for booking confirmation emails |

**Anonymous booking (no auth):** `GET /api/booking/services`, `GET /api/booking/services/:serviceId/providers`, `POST /api/booking/available-hours`, `POST /api/booking/unavailable-dates`, `POST /api/booking/appointments`. **Stripe:** `POST /api/stripe/webhook` (configure `STRIPE_*` env). **Queue health (staff admin):** `GET /api/staff/system/queue`; background worker: `pnpm --filter @openbook/api run worker` when `REDIS_URL` is set.

**Blocked on** column (for planning): most staff/customer pages require **Prisma + MySQL**, **JWT/session auth**, and **RBAC** from `ea_roles` permission integers.
