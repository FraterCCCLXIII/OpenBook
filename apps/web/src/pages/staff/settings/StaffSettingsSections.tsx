import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiJson } from '../../../lib/api';

type SectionValues = Record<string, string>;

const NAV = [
  { path: 'general', label: 'General' },
  { path: 'business', label: 'Business' },
  { path: 'booking', label: 'Booking' },
  { path: 'api', label: 'API' },
  { path: 'stripe', label: 'Stripe' },
  { path: 'ldap', label: 'LDAP' },
  { path: 'email-notifications', label: 'Email / SMTP' },
  { path: 'legal', label: 'Legal' },
  { path: 'analytics', label: 'Analytics' },
  { path: 'customer-login', label: 'Customer login' },
  { path: 'customer-profiles', label: 'Customer profiles' },
  { path: 'service-areas', label: 'Service areas' },
] as const;

const settingsNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
          Each section is validated and patched via{' '}
          <code className="text-zinc-600">PATCH /api/staff/settings/section/:section</code>.
        </p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <nav
          className="w-full shrink-0 border-b border-zinc-800 pb-4 md:w-56 md:border-b-0 md:border-r md:pb-0 md:pr-6"
          aria-label="Settings sections"
        >
          <ul className="flex flex-col gap-0.5">
            {NAV.map((n) => (
              <li key={n.path}>
                <NavLink
                  to={`/staff/settings/${n.path}`}
                  className={settingsNavLinkClass}
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
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
  type?: 'text' | 'email' | 'url' | 'number' | 'password' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  secret?: boolean;
};

const SECTION_FIELDS: Record<string, FieldDef[]> = {
  general: [
    { key: 'company_name', label: 'Company name', placeholder: 'Your business' },
    { key: 'company_email', label: 'Company email', type: 'email', placeholder: 'contact@example.com' },
    { key: 'company_link', label: 'Website URL', type: 'url', placeholder: 'https://example.com' },
    { key: 'date_format', label: 'Date format', placeholder: 'DMY' },
    { key: 'time_format', label: 'Time format', type: 'select', options: [{ value: '12', label: '12-hour' }, { value: '24', label: '24-hour' }] },
    { key: 'first_weekday', label: 'First weekday', placeholder: 'monday' },
  ],
  business: [
    { key: 'company_address', label: 'Address' },
    { key: 'company_city', label: 'City' },
    { key: 'company_zip_code', label: 'ZIP code' },
    { key: 'company_phone', label: 'Phone' },
    { key: 'company_working_plan', label: 'Working plan (JSON)', type: 'textarea' },
    { key: 'company_notes', label: 'Notes', type: 'textarea' },
  ],
  booking: [
    { key: 'book_advance_timeout', label: 'Min advance booking (minutes)', type: 'number' },
    { key: 'future_booking_limit', label: 'Future booking limit (days)', type: 'number' },
    { key: 'require_phone_number', label: 'Require phone', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'customer_notifications', label: 'Customer notifications', type: 'select', options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }] },
    { key: 'provider_notifications', label: 'Provider notifications', type: 'select', options: [{ value: '0', label: 'Off' }, { value: '1', label: 'On' }] },
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
    { key: 'require_last_name', label: 'Require last name', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'require_phone_number', label: 'Require phone number', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'require_address', label: 'Require address', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
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
  const [values, setValues] = useState<SectionValues>(initialValues);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    m.mutate(values);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {fields.map((field) => (
        <label key={field.key} className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">{field.label}</span>
          {field.type === 'textarea' ? (
            <textarea
              rows={4}
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            />
          ) : field.type === 'select' ? (
            <select
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            >
              <option value="">— select —</option>
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
    </div>
  );
}
