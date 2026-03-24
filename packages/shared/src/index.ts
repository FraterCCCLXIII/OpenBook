import { z } from 'zod';

// ─── Health ──────────────────────────────────────────────────────────────────

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string().optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const createHealthResponse = (service: string, version?: string): HealthResponse => ({
  status: 'ok',
  service,
  ...(version !== undefined ? { version } : {}),
});

// ─── Role slugs ───────────────────────────────────────────────────────────────

export const ROLE_SLUGS = ['admin', 'provider', 'secretary', 'customer'] as const;
export type RoleSlug = (typeof ROLE_SLUGS)[number];

// ─── Appointment status ───────────────────────────────────────────────────────

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

// ─── Payment status ───────────────────────────────────────────────────────────

export const PAYMENT_STATUSES = [
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ─── Settings schemas per section ────────────────────────────────────────────

export const generalSettingsSchema = z.object({
  company_name: z.string().min(1).max(256).optional(),
  company_email: z.string().email().optional(),
  company_link: z.string().url().optional().or(z.literal('')),
  date_format: z.string().optional(),
  time_format: z.enum(['12', '24']).optional(),
  first_weekday: z.string().optional(),
  /** Data URL or raw base64; large string stored in `ea_settings`. */
  company_logo: z.string().max(8_000_000).optional(),
  company_logo_email_png: z.string().max(8_000_000).optional(),
  /** Hex color e.g. #2563eb */
  company_color: z.string().max(32).optional(),
  /** UI theme hint for public shell */
  theme: z.enum(['default', 'light', 'dark']).optional(),
  default_language: z.string().max(16).optional(),
  default_timezone: z.string().max(128).optional(),
});
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;

export const businessSettingsSchema = z.object({
  company_working_plan: z.string().optional(),
  company_address: z.string().max(512).optional(),
  company_city: z.string().max(256).optional(),
  company_zip_code: z.string().max(32).optional(),
  company_phone: z.string().max(64).optional(),
  company_notes: z.string().max(1024).optional(),
});
export type BusinessSettings = z.infer<typeof businessSettingsSchema>;

export const bookingSettingsSchema = z.object({
  book_advance_timeout: z.coerce.number().int().min(0).optional(),
  future_booking_limit: z.coerce.number().int().min(1).optional(),
  require_captcha: z.enum(['0', '1']).optional(),
  customer_notifications: z.enum(['0', '1']).optional(),
  provider_notifications: z.enum(['0', '1']).optional(),
  limit_provider_customer_access: z.enum(['0', '1']).optional(),
  limit_secretary_customer_access: z.enum(['0', '1']).optional(),
  display_any_provider: z.enum(['0', '1']).optional(),
  display_login_button: z.enum(['0', '1']).optional(),
  display_language_selector: z.enum(['0', '1']).optional(),
  display_delete_personal_information: z.enum(['0', '1']).optional(),
  disable_booking: z.enum(['0', '1']).optional(),
  disable_booking_message: z.string().max(4096).optional(),
});
export type BookingSettings = z.infer<typeof bookingSettingsSchema>;

export const apiSettingsSchema = z.object({
  api_token: z.string().min(16).max(256).optional(),
});
export type ApiSettings = z.infer<typeof apiSettingsSchema>;

export const stripeSettingsSchema = z.object({
  stripe_secret_key: z.string().optional(),
  stripe_publishable_key: z.string().optional(),
  stripe_webhook_secret: z.string().optional(),
});
export type StripeSettings = z.infer<typeof stripeSettingsSchema>;

/** Keys align with `ea_settings` and staff LDAP login (`ldap_is_active`, `ldap_username`, …). */
export const ldapSettingsSchema = z.object({
  ldap_is_active: z.enum(['0', '1']).optional(),
  ldap_host: z.string().optional(),
  ldap_port: z.coerce.number().int().min(1).max(65535).optional(),
  /** Service bind DN (stored as `ldap_username` in DB; used by staff LDAP login). */
  ldap_username: z.string().optional(),
  ldap_password: z.string().optional(),
  ldap_base_dn: z.string().optional(),
  /** Optional extra DN field kept for parity with legacy UIs. */
  ldap_dn: z.string().optional(),
  ldap_uid_field: z.string().optional(),
  ldap_tls: z.enum(['0', '1']).optional(),
  /**
   * LDAP filter template for user lookup before bind, e.g. `(mail=${email})` or `(uid=${email})`.
   * When set, the server binds with the service account, searches `ldap_base_dn`, then binds as the found DN.
   */
  ldap_user_search_filter: z.string().optional(),
  /**
   * JSON map of OpenBook user fields → LDAP attribute names for future import/sync UIs, e.g.
   * `{"email":"mail","firstName":"givenName","lastName":"sn"}`.
   */
  ldap_field_mapping: z.string().optional(),
  /**
   * Filter template for staff directory search / import, e.g. `(&(objectClass=inetOrgPerson)(mail=*${query}*))`.
   * `${query}` is LDAP-filter escaped.
   */
  ldap_directory_search_filter: z.string().optional(),
});
export type LdapSettings = z.infer<typeof ldapSettingsSchema>;

export const emailNotificationsSettingsSchema = z.object({
  email_notifications: z.enum(['0', '1']).optional(),
  smtp_host: z.string().optional(),
  smtp_port: z.coerce.number().int().min(1).max(65535).optional(),
  smtp_encryption: z.enum(['none', 'tls', 'ssl']).optional(),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  notifications_from_email: z.string().email().optional().or(z.literal('')),
  notifications_from_name: z.string().optional(),
  appointment_change_notify_customer: z.enum(['0', '1']).optional(),
  appointment_change_notify_provider: z.enum(['0', '1']).optional(),
  appointment_change_notify_admin: z.enum(['0', '1']).optional(),
  appointment_change_notify_staff: z.enum(['0', '1']).optional(),
  customer_profile_completion_notifications: z.enum(['0', '1']).optional(),
  customer_login_otp_notifications: z.enum(['0', '1']).optional(),
  account_recovery_notifications: z.enum(['0', '1']).optional(),
});
export type EmailNotificationsSettings = z.infer<typeof emailNotificationsSettingsSchema>;

export const legalSettingsSchema = z.object({
  display_terms_and_conditions: z.enum(['0', '1']).optional(),
  terms_and_conditions_content: z.string().optional(),
  display_cookie_notice: z.enum(['0', '1']).optional(),
  cookie_notice_content: z.string().optional(),
  display_privacy_policy: z.enum(['0', '1']).optional(),
  privacy_policy_content: z.string().optional(),
});
export type LegalSettings = z.infer<typeof legalSettingsSchema>;

export const analyticsSettingsSchema = z.object({
  google_analytics_code: z.string().optional(),
  matomo_analytics_active: z.enum(['0', '1']).optional(),
  matomo_analytics_url: z.string().url().optional().or(z.literal('')),
  matomo_analytics_site_id: z.string().optional(),
});
export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;

export const customerLoginSettingsSchema = z.object({
  customer_login_enabled: z.enum(['0', '1']).optional(),
  customer_login_mode: z.enum(['password', 'otp', 'both']).optional(),
});
export type CustomerLoginSettings = z.infer<typeof customerLoginSettingsSchema>;

export const customerProfilesSettingsSchema = z.object({
  require_first_name: z.enum(['0', '1']).optional(),
  require_last_name: z.enum(['0', '1']).optional(),
  require_phone_number: z.enum(['0', '1']).optional(),
  require_address: z.enum(['0', '1']).optional(),
  require_notes: z.enum(['0', '1']).optional(),
  display_first_name: z.enum(['0', '1']).optional(),
  display_last_name: z.enum(['0', '1']).optional(),
  display_email: z.enum(['0', '1']).optional(),
  display_phone_number: z.enum(['0', '1']).optional(),
  display_address: z.enum(['0', '1']).optional(),
  display_city: z.enum(['0', '1']).optional(),
  display_zip_code: z.enum(['0', '1']).optional(),
  display_notes: z.enum(['0', '1']).optional(),
  display_timezone: z.enum(['0', '1']).optional(),
});
export type CustomerProfilesSettings = z.infer<typeof customerProfilesSettingsSchema>;

export const serviceAreasSettingsSchema = z.object({
  service_area_countries: z.string().optional(),
  service_area_notes: z.string().optional(),
});
export type ServiceAreasSettings = z.infer<typeof serviceAreasSettingsSchema>;

export const SETTINGS_SECTION_SCHEMAS = {
  general: generalSettingsSchema,
  business: businessSettingsSchema,
  booking: bookingSettingsSchema,
  api: apiSettingsSchema,
  stripe: stripeSettingsSchema,
  ldap: ldapSettingsSchema,
  'email-notifications': emailNotificationsSettingsSchema,
  legal: legalSettingsSchema,
  analytics: analyticsSettingsSchema,
  'customer-login': customerLoginSettingsSchema,
  'customer-profiles': customerProfilesSettingsSchema,
  'service-areas': serviceAreasSettingsSchema,
} as const;

export type SettingsSectionKey = keyof typeof SETTINGS_SECTION_SCHEMAS;

/** Stripe-sensitive keys that must never appear in GET /api/settings/public */
export const SECRET_SETTING_KEYS = new Set([
  'stripe_secret_key',
  'stripe_webhook_secret',
  'smtp_password',
  'ldap_password',
  'api_token',
]);

/** Keys safe for anonymous / customer legal UX (no secrets). */
export const LEGAL_PUBLIC_SETTING_NAMES = new Set([
  'display_terms_and_conditions',
  'terms_and_conditions_content',
  'display_cookie_notice',
  'cookie_notice_content',
  'display_privacy_policy',
  'privacy_policy_content',
]);

// ─── Typed API response shapes ────────────────────────────────────────────────

export const appointmentSchema = z.object({
  id: z.string(),
  start: z.string().nullable(),
  end: z.string().nullable(),
  book: z.string().nullable().optional(),
  notes: z.string().nullable(),
  providerId: z.string().nullable(),
  customerId: z.string().nullable(),
  serviceId: z.string().nullable(),
});
export type AppointmentDto = z.infer<typeof appointmentSchema>;

export const serviceSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  duration: z.number().nullable(),
  price: z.string().nullable(),
  currency: z.string().nullable(),
  description: z.string().nullable(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  attendantsNumber: z.number().nullable(),
});
export type ServiceDto = z.infer<typeof serviceSchema>;

export const userSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  timezone: z.string().nullable(),
});
export type UserDto = z.infer<typeof userSchema>;

export const webhookSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  actions: z.string().nullable(),
  isActive: z.boolean(),
  notes: z.string().nullable(),
});
export type WebhookDto = z.infer<typeof webhookSchema>;

export const formFieldSchema = z.object({
  id: z.number(),
  label: z.string(),
  fieldType: z.string(),
  options: z.array(z.string()),
  isRequired: z.boolean(),
  sortOrder: z.number(),
});
export type FormFieldDto = z.infer<typeof formFieldSchema>;

export const formSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  fields: z.array(formFieldSchema).optional(),
  roleAssignments: z.array(z.string()).optional(),
});
export type FormDto = z.infer<typeof formSchema>;
