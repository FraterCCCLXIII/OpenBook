import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  KeyRound,
  LogIn,
  Mail,
  MapPin,
  Scale,
  Settings,
  Shield,
  UserCircle,
  Webhook,
  Wrench,
} from 'lucide-react';
import { apiJson } from '../../../lib/api';
import { StaffLdapImportPanel } from '../../../components/staff/StaffLdapImportPanel';
import { StaffWorkingPlanEditor } from '../../../components/staff/StaffWorkingPlanEditor';
import { TIMEZONE_GROUPS } from '../../../lib/timezones';

type SectionValues = Record<string, string>;

const NAV: { path: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { path: 'general', label: 'General', icon: Settings },
  { path: 'business', label: 'Business', icon: Building2 },
  { path: 'booking', label: 'Booking', icon: Calendar },
  { path: 'email-notifications', label: 'Email / SMTP', icon: Mail },
  { path: 'customer-login', label: 'Customer login', icon: LogIn },
  { path: 'customer-profiles', label: 'Customer profiles', icon: UserCircle },
  { path: 'legal', label: 'Legal', icon: Scale },
  { path: 'analytics', label: 'Analytics', icon: BarChart3 },
  { path: 'service-areas', label: 'Service areas', icon: MapPin },
  { path: 'forms', label: 'Forms', icon: FileText, exact: true },
  { path: 'custom-fields', label: 'Custom fields', icon: ClipboardList, exact: true },
  { path: 'tools', label: 'Tools', icon: Wrench, exact: true },
  { path: 'consents', label: 'Consents', icon: Shield, exact: true },
  { path: 'stripe', label: 'Stripe', icon: CreditCard },
  { path: 'api', label: 'API', icon: KeyRound },
  { path: 'ldap', label: 'LDAP', icon: Shield },
  { path: 'webhooks', label: 'Webhooks', icon: Webhook },
];

const settingsNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-zinc-800 text-zinc-50'
      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
  ].join(' ');

export function StaffSettingsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Admin settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure your business, branding, booking rules, and integrations.
        </p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <nav
          className="w-full shrink-0 border-b border-zinc-800 pb-4 md:w-56 md:border-b-0 md:pb-0"
          aria-label="Settings sections"
        >
          <ul className="flex flex-col gap-0.5">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.path}>
                  <NavLink
                    to={`/staff/settings/${n.path}`}
                    end={n.exact}
                    className={settingsNavLinkClass}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    <span className="min-w-0">{n.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

type FieldDef = {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'email'
    | 'url'
    | 'number'
    | 'password'
    | 'textarea'
    | 'select'
    | 'logo'
    | 'color'
    | 'timezoneSelect';
  options?: { value: string; label: string }[];
  placeholder?: string;
  secret?: boolean;
  /** Short helper under the label (e.g. shared keys across sections). */
  hint?: string;
};

const SECTION_FIELDS: Record<string, FieldDef[]> = {
  general: [
    { key: 'company_name', label: 'Company name', placeholder: 'Your business' },
    { key: 'company_email', label: 'Company email', type: 'email', placeholder: 'contact@example.com' },
    { key: 'company_link', label: 'Website URL', type: 'url', placeholder: 'https://example.com' },
    { key: 'company_logo', label: 'Company logo (image)', type: 'logo' },
    { key: 'company_logo_email_png', label: 'Email logo (PNG, optional)', type: 'logo' },
    { key: 'company_color', label: 'Brand color', type: 'color' },
    {
      key: 'theme',
      label: 'Public theme',
      type: 'select',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ],
    },
    {
      key: 'date_format',
      label: 'Date format',
      type: 'select',
      options: [
        { value: 'DMY', label: 'DMY' },
        { value: 'MDY', label: 'MDY' },
        { value: 'YMD', label: 'YMD' },
      ],
    },
    { key: 'time_format', label: 'Time format', type: 'select', options: [{ value: '12', label: '12-hour' }, { value: '24', label: '24-hour' }] },
    {
      key: 'first_weekday',
      label: 'First weekday',
      type: 'select',
      options: [
        { value: 'sunday', label: 'Sunday' },
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
      ],
    },
    {
      key: 'default_language',
      label: 'Default language',
      type: 'select',
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
      ],
    },
    { key: 'default_timezone', label: 'Default timezone', type: 'timezoneSelect' },
  ],
  business: [
    { key: 'company_address', label: 'Address' },
    { key: 'company_city', label: 'City' },
    { key: 'company_zip_code', label: 'ZIP code' },
    { key: 'company_phone', label: 'Phone' },
    { key: 'company_notes', label: 'Notes', type: 'textarea' },
  ],
  booking: [
    { key: 'book_advance_timeout', label: 'Min advance booking (minutes)', type: 'number' },
    { key: 'future_booking_limit', label: 'Future booking limit (days)', type: 'number' },
    { key: 'require_captcha', label: 'Require CAPTCHA', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'customer_notifications', label: 'Customer notifications', type: 'select', options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }] },
    { key: 'provider_notifications', label: 'Provider notifications', type: 'select', options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }] },
    { key: 'limit_provider_customer_access', label: 'Limit provider CRM access', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'limit_secretary_customer_access', label: 'Limit secretary CRM access', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_any_provider', label: 'Let customers choose provider', type: 'select', options: [{ value: '0', label: 'No (auto)' }, { value: '1', label: 'Yes' }] },
    { key: 'display_login_button', label: 'Show login button (public nav)', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_language_selector', label: 'Show language selector', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    {
      key: 'display_delete_personal_information',
      label: 'Show delete personal data option',
      type: 'select',
      options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }],
    },
    { key: 'disable_booking', label: 'Disable public booking', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'disable_booking_message', label: 'Message when booking disabled', type: 'textarea' },
  ],
  api: [
    { key: 'api_token', label: 'API bearer token', type: 'password', secret: true, placeholder: 'min 16 chars' },
  ],
  stripe: [
    { key: 'stripe_publishable_key', label: 'Publishable key', placeholder: 'pk_...' },
    { key: 'stripe_secret_key', label: 'Secret key', type: 'password', secret: true, placeholder: 'sk_...' },
    { key: 'stripe_webhook_secret', label: 'Webhook secret', type: 'password', secret: true, placeholder: 'whsec_...' },
  ],
  'email-notifications': [
    { key: 'email_notifications', label: 'Enable email notifications', type: 'select', options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }] },
    { key: 'smtp_host', label: 'SMTP host', placeholder: 'smtp.example.com' },
    { key: 'smtp_port', label: 'SMTP port', type: 'number', placeholder: '587' },
    { key: 'smtp_encryption', label: 'Encryption', type: 'select', options: [{ value: 'none', label: 'None' }, { value: 'tls', label: 'TLS' }, { value: 'ssl', label: 'SSL' }] },
    { key: 'smtp_username', label: 'SMTP username' },
    { key: 'smtp_password', label: 'SMTP password', type: 'password', secret: true },
    { key: 'notifications_from_email', label: 'From email', type: 'email' },
    { key: 'notifications_from_name', label: 'From name' },
    {
      key: 'appointment_change_notify_customer',
      label: 'Notify customer on appointment changes',
      type: 'select',
      options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }],
    },
    {
      key: 'appointment_change_notify_provider',
      label: 'Notify provider on appointment changes',
      type: 'select',
      options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }],
    },
    {
      key: 'appointment_change_notify_admin',
      label: 'Notify admin on appointment changes',
      type: 'select',
      options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }],
    },
    {
      key: 'appointment_change_notify_staff',
      label: 'Notify staff on appointment changes',
      type: 'select',
      options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }],
    },
    {
      key: 'customer_profile_completion_notifications',
      label: 'Profile completion reminders',
      type: 'select',
      options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }],
    },
    {
      key: 'customer_login_otp_notifications',
      label: 'Customer login OTP emails',
      type: 'select',
      options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }],
    },
    {
      key: 'account_recovery_notifications',
      label: 'Account recovery emails',
      type: 'select',
      options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }],
    },
  ],
  legal: [
    { key: 'display_terms_and_conditions', label: 'Show T&C', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'terms_and_conditions_content', label: 'T&C content', type: 'textarea' },
    { key: 'display_cookie_notice', label: 'Show cookie notice', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'cookie_notice_content', label: 'Cookie notice content', type: 'textarea' },
    { key: 'display_privacy_policy', label: 'Show privacy policy', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'privacy_policy_content', label: 'Privacy policy content', type: 'textarea' },
  ],
  analytics: [
    { key: 'google_analytics_code', label: 'Google Analytics code', placeholder: 'G-XXXXXX' },
    { key: 'matomo_analytics_active', label: 'Matomo enabled', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'matomo_analytics_url', label: 'Matomo URL', type: 'url', placeholder: 'https://matomo.example.com' },
    { key: 'matomo_analytics_site_id', label: 'Matomo site ID' },
  ],
  'customer-login': [
    { key: 'customer_login_enabled', label: 'Customer portal enabled', type: 'select', options: [{ value: '0', label: 'Disabled' }, { value: '1', label: 'Enabled' }] },
    { key: 'customer_login_mode', label: 'Login mode', type: 'select', options: [{ value: 'password', label: 'Password' }, { value: 'otp', label: 'OTP' }, { value: 'both', label: 'Both' }] },
  ],
  'customer-profiles': [
    { key: 'display_first_name', label: 'Show first name', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'require_first_name', label: 'Require first name', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_last_name', label: 'Show last name', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'require_last_name', label: 'Require last name', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_email', label: 'Show email', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_phone_number', label: 'Show phone', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    {
      key: 'require_phone_number',
      label: 'Require phone number',
      type: 'select',
      options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }],
      hint: 'Also applies to the public booking form.',
    },
    { key: 'display_address', label: 'Show address', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'require_address', label: 'Require address', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_city', label: 'Show city', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_zip_code', label: 'Show ZIP/postal code', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_notes', label: 'Show notes', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'require_notes', label: 'Require notes', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'display_timezone', label: 'Show timezone', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
  ],
  ldap: [
    { key: 'ldap_is_active', label: 'LDAP active', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'ldap_host', label: 'Host' },
    { key: 'ldap_port', label: 'Port', type: 'number' },
    { key: 'ldap_username', label: 'Bind username' },
    { key: 'ldap_password', label: 'Bind password', type: 'password', secret: true },
    { key: 'ldap_base_dn', label: 'Base DN' },
    { key: 'ldap_dn', label: 'Bind DN' },
    { key: 'ldap_uid_field', label: 'UID field', placeholder: 'uid' },
    { key: 'ldap_tls', label: 'TLS', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    {
      key: 'ldap_user_search_filter',
      label: 'User search filter',
      type: 'textarea',
      placeholder: '(mail=${email}) or (uid=${email})',
    },
    {
      key: 'ldap_field_mapping',
      label: 'Field mapping (JSON)',
      type: 'textarea',
      placeholder: '{"email":"mail","firstName":"givenName"}',
    },
    {
      key: 'ldap_directory_search_filter',
      label: 'Directory search filter',
      type: 'textarea',
      placeholder: '(&(objectClass=inetOrgPerson)(mail=*${query}*))',
    },
  ],
  'service-areas': [
    { key: 'service_area_countries', label: 'Countries (comma-separated)', type: 'textarea', placeholder: 'US,CA,GB' },
    { key: 'service_area_notes', label: 'Service area notes', type: 'textarea' },
  ],
};

function SectionForm({ section }: { section: string }) {
  const fields = SECTION_FIELDS[section] ?? [];

  const q = useQuery({
    queryKey: ['staff', 'settings', 'section', section],
    queryFn: () => apiJson<SectionValues>(`/api/staff/settings/section/${section}`),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const serverValues: SectionValues = Object.fromEntries(
    Object.entries(q.data ?? {}).map(([k, v]) => [k, v ?? '']),
  );

  // key the inner form on the data identity so React remounts it (and resets
  // local state) when fresh server data arrives — avoids setState-in-effect.
  return (
    <SectionFormInner
      key={JSON.stringify(serverValues)}
      section={section}
      initialValues={serverValues}
      fields={fields}
    />
  );
}

function SectionFormInner({
  section,
  initialValues,
  fields,
}: {
  section: string;
  initialValues: SectionValues;
  fields: typeof SECTION_FIELDS[string];
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState<SectionValues>(() => {
    const result = { ...initialValues };
    for (const f of fields) {
      if (f.type === 'select' && !result[f.key] && f.options?.length) {
        result[f.key] = f.options[0].value;
      }
      if (f.type === 'timezoneSelect' && !result[f.key]) {
        result[f.key] = 'UTC';
      }
    }
    return result;
  });

  const m = useMutation({
    mutationFn: (body: SectionValues) =>
      apiJson(`/api/staff/settings/section/${section}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'settings', 'section', section] });
    },
  });

  const applyPlan = useMutation({
    mutationFn: () =>
      apiJson<{ updated: number }>('/api/staff/settings/apply-global-working-plan', {
        method: 'POST',
      }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    m.mutate(values);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {section === 'business' && (
        <div className="space-y-2">
          <span className="text-xs uppercase text-zinc-500">Working plan</span>
          <p className="text-xs text-zinc-600">
            Weekly hours for the organization. Save before applying to all providers.
          </p>
          <StaffWorkingPlanEditor
            workingPlanJson={values.company_working_plan}
            onWorkingPlanChange={(json) =>
              setValues((v) => ({ ...v, company_working_plan: json }))
            }
          />
          <button
            type="button"
            disabled={applyPlan.isPending}
            onClick={() => applyPlan.mutate()}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {applyPlan.isPending ? 'Applying…' : 'Apply to all providers'}
          </button>
          {applyPlan.isSuccess && (
            <p className="text-sm text-emerald-500">
              Updated {applyPlan.data.updated} provider
              {applyPlan.data.updated === 1 ? '' : 's'}.
            </p>
          )}
          {applyPlan.isError && (
            <p className="text-sm text-red-400">{(applyPlan.error as Error).message}</p>
          )}
        </div>
      )}
      {fields.map((field) => (
        <label key={field.key} className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">{field.label}</span>
          {field.hint && <span className="block text-xs font-normal normal-case text-zinc-600">{field.hint}</span>}
          {field.type === 'textarea' ? (
            <textarea
              rows={4}
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            />
          ) : field.type === 'logo' ? (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                className="w-full text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:text-zinc-200"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const data = String(reader.result ?? '');
                    setValues((v) => {
                      const next = { ...v, [field.key]: data };
                      // Auto-populate the email logo when a SVG main logo is uploaded
                      if (field.key === 'company_logo' && f.type === 'image/svg+xml') {
                        next.company_logo_email_png = data;
                      }
                      return next;
                    });
                  };
                  reader.readAsDataURL(f);
                }}
              />
              {values[field.key] ? (
                <div className="flex items-end gap-3">
                  <img
                    src={values[field.key]}
                    alt=""
                    className="max-h-20 max-w-[200px] rounded border border-zinc-700 object-contain"
                  />
                  <button
                    type="button"
                    className="text-xs text-red-400 hover:underline"
                    onClick={() => setValues((v) => ({ ...v, [field.key]: '' }))}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          ) : field.type === 'color' ? (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={
                  /^#[0-9A-Fa-f]{6}$/.test(values[field.key] ?? '')
                    ? values[field.key]
                    : '#2563eb'
                }
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                className="h-10 w-14 cursor-pointer rounded border border-zinc-700 bg-zinc-950"
              />
              <input
                type="text"
                value={values[field.key] ?? ''}
                placeholder="#2563eb"
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
              />
            </div>
          ) : field.type === 'timezoneSelect' ? (
            <select
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            >
              {TIMEZONE_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          ) : field.type === 'select' ? (
            <select
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type ?? 'text'}
              value={values[field.key] ?? ''}
              placeholder={field.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            />
          )}
        </label>
      ))}

      {fields.length === 0 && (
        <p className="text-sm text-zinc-500">No configurable fields for this section yet.</p>
      )}

      {fields.length > 0 && (
        <>
          <button
            type="submit"
            disabled={m.isPending}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {m.isPending ? 'Saving…' : 'Save'}
          </button>
          {m.isError && <p className="text-sm text-red-400">{(m.error as Error).message}</p>}
          {m.isSuccess && <p className="text-sm text-emerald-500">Saved.</p>}
        </>
      )}
    </form>
  );
}

export function StaffSettingsSectionPage() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (section && !NAV.some((n) => n.path === section)) {
      void navigate('/staff/settings/general', { replace: true });
    }
  }, [section, navigate]);

  const nav = NAV.find((n) => n.path === section);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-100">{nav?.label ?? section}</h2>
      {section && <SectionForm section={section} />}
      {section === 'ldap' && <StaffLdapImportPanel />}
    </div>
  );
}

const INTEGRATION_LINKS: { path: string; label: string; description: string }[] = [
  { path: 'api', label: 'API', description: 'Bearer token for REST integrations' },
  { path: 'stripe', label: 'Stripe', description: 'Payments and webhooks' },
  { path: 'ldap', label: 'LDAP', description: 'Directory authentication and import' },
  { path: 'analytics', label: 'Analytics', description: 'Google Analytics and Matomo' },
];

export function StaffSettingsIntegrationsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-100">Integrations</h2>
      <p className="text-sm text-zinc-500">
        Quick links to integration-related settings. Each opens a standard settings section.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {INTEGRATION_LINKS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={`/staff/settings/${item.path}`}
              className="block rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 transition-colors hover:border-zinc-600"
            >
              <span className="font-medium text-zinc-100">{item.label}</span>
              <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
