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
| `/api/v1/*` | Same path prefix | `ApiV1Module` — `GET /api/v1/ping`, `GET /api/v1/services`, `GET /api/v1/appointments` | REST + Bearer (`OPENBOOK_API_TOKEN`) |

**Anonymous booking (no auth):** `GET /api/booking/services`, `GET /api/booking/services/:serviceId/providers`, `POST /api/booking/available-hours`, `POST /api/booking/unavailable-dates`, `POST /api/booking/appointments` (create guest appointment). **Stripe:** `POST /api/stripe/webhook` (configure `STRIPE_*` env). **Queue health (staff admin):** `GET /api/staff/system/queue`; background worker: `pnpm --filter @openbook/api run worker` when `REDIS_URL` is set.

**Blocked on** column (for planning): most staff/customer pages require **Prisma + MySQL**, **JWT/session auth**, and **RBAC** from `ea_roles` permission integers.
