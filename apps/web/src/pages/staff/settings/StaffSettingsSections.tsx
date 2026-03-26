import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  KeyRound,
  LogIn,
  Mail,
  MapPin,
  Plug2,
  Scale,
  Settings,
  Shield,
  UserCircle,
  Webhook,
} from 'lucide-react';
import { apiJson } from '../../../lib/api';
import { StaffLdapImportPanel } from '../../../components/staff/StaffLdapImportPanel';
import { StaffWorkingPlanEditor } from '../../../components/staff/StaffWorkingPlanEditor';
import { RichTextEditor } from '../../../components/staff/RichTextEditor';
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
  { path: 'service-areas', label: 'Service areas', icon: MapPin },
  { path: 'forms', label: 'Forms', icon: FileText, exact: true },
  { path: 'custom-fields', label: 'Custom fields', icon: ClipboardList, exact: true },
  { path: 'consents', label: 'Consents', icon: Shield, exact: true },
  { path: 'integrations', label: 'Integrations', icon: Plug2, exact: true },
];

const settingsNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-zinc-800 text-zinc-50'
      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
  ].join(' ');

const INTEGRATION_SUB_PATHS = new Set([
  'webhooks', 'analytics', 'matomo', 'stripe', 'api', 'ldap', 'tools',
]);

const SECTION_LABELS: Record<string, string> = {
  general: 'General',
  business: 'Business',
  booking: 'Booking',
  'email-notifications': 'Email / SMTP',
  'customer-login': 'Customer Login',
  'customer-profiles': 'Customer Profiles',
  legal: 'Legal',
  'service-areas': 'Service Areas',
  forms: 'Forms',
  'custom-fields': 'Custom Fields',
  consents: 'Consents',
  analytics: 'Google Analytics',
  matomo: 'Matomo Analytics',
  stripe: 'Stripe',
  api: 'API',
  ldap: 'LDAP',
  webhooks: 'Webhooks',
  tools: 'GeoNames',
};

/** All valid :section values — includes integration sub-pages removed from the sidebar nav. */
const VALID_SECTIONS = new Set([
  ...NAV.map((n) => n.path),
  ...INTEGRATION_SUB_PATHS,
]);

export function StaffSettingsLayout() {
  const location = useLocation();
  const segment = location.pathname.split('/').filter(Boolean).pop() ?? '';
  const isIntegrationSubPage = INTEGRATION_SUB_PATHS.has(segment);

  return (
    /* Pull back the p-6 from the shell's inner wrapper so we can own the
       full height and give each column its own independent scroll area. */
    <div className="-m-6 flex h-dvh overflow-hidden md:flex-row">
      <nav
        className="hidden w-56 shrink-0 overflow-y-auto border-r border-zinc-800 px-3 py-6 md:flex md:flex-col"
        aria-label="Settings sections"
      >
        <h1 className="mb-3 px-3 text-2xl font-semibold text-zinc-50">Admin settings</h1>
        <ul className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.path}>
                <NavLink
                  to={`/staff/settings/${n.path}`}
                  end={n.exact}
                  className={({ isActive }) =>
                    settingsNavLinkClass({
                      isActive: isActive || (n.path === 'integrations' && isIntegrationSubPage),
                    })
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  <span className="min-w-0">{n.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex-1 overflow-y-auto p-6">
        {isIntegrationSubPage && (
          <div className="mb-5">
            <Link
              to="/staff/settings/integrations"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10 3L5 8l5 5" />
              </svg>
              Integrations
            </Link>
          </div>
        )}
        <Outlet />
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
    | 'richtext'
    | 'select'
    | 'logo'
    | 'color'
    | 'timezoneSelect'
    | 'fileSizeWithUnit';
  options?: { value: string; label: string }[];
  placeholder?: string;
  secret?: boolean;
  /** Short helper under the label (e.g. shared keys across sections). */
  hint?: string;
};

/** Converts stored MB value to a human { num, unit } pair for display. */
function mbToDisplay(mbStr: string | undefined): { num: string; unit: 'MB' | 'GB' } {
  const mb = parseInt(mbStr ?? '15', 10);
  if (!isNaN(mb) && mb >= 1024 && mb % 1024 === 0) {
    return { num: String(mb / 1024), unit: 'GB' };
  }
  return { num: isNaN(mb) ? '15' : String(mb), unit: 'MB' };
}

function displayToMb(num: string, unit: 'MB' | 'GB'): string {
  const n = parseInt(num, 10);
  if (isNaN(n) || n < 1) return unit === 'GB' ? '1024' : '1';
  return unit === 'GB' ? String(n * 1024) : String(n);
}

function FileSizeInput({
  valueMb,
  onChange,
}: {
  valueMb: string | undefined;
  onChange: (mbStr: string) => void;
}) {
  const initial = mbToDisplay(valueMb);
  const [num, setNum] = useState(initial.num);
  const [unit, setUnit] = useState<'MB' | 'GB'>(initial.unit);

  const inputCls =
    'rounded-l-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2 w-32';
  const selectCls =
    'rounded-r-md border border-l-0 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2';

  return (
    <div className="flex">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={num}
        onChange={(e) => {
          setNum(e.target.value);
          onChange(displayToMb(e.target.value, unit));
        }}
        className={inputCls}
      />
      <select
        value={unit}
        onChange={(e) => {
          const newUnit = e.target.value as 'MB' | 'GB';
          setUnit(newUnit);
          onChange(displayToMb(num, newUnit));
        }}
        className={selectCls}
      >
        <option value="MB">MB</option>
        <option value="GB">GB</option>
      </select>
    </div>
  );
}

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
    {
      key: 'max_upload_size_mb',
      label: 'Max file upload size',
      type: 'fileSizeWithUnit',
      hint: 'Maximum size for a single file upload by staff. Up to 10 GB. Defaults to 15 MB.',
    },
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
    { key: 'terms_and_conditions_content', label: 'T&C content', type: 'richtext' },
    { key: 'display_cookie_notice', label: 'Show cookie notice', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'cookie_notice_content', label: 'Cookie notice content', type: 'richtext' },
    { key: 'display_privacy_policy', label: 'Show privacy policy', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'privacy_policy_content', label: 'Privacy policy content', type: 'richtext' },
  ],
  analytics: [
    { key: 'google_analytics_code', label: 'Google Analytics code', placeholder: 'G-XXXXXX' },
  ],
  matomo: [
    { key: 'matomo_analytics_active', label: 'Matomo enabled', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { key: 'matomo_analytics_url', label: 'Matomo URL', type: 'url', placeholder: 'https://matomo.example.com' },
    { key: 'matomo_analytics_site_id', label: 'Matomo site ID' },
  ],
  'customer-login': [
    { key: 'customer_login_enabled', label: 'Customer portal enabled', type: 'select', options: [{ value: '0', label: 'Disabled' }, { value: '1', label: 'Enabled' }] },
    { key: 'customer_login_mode', label: 'Login mode', type: 'select', options: [{ value: 'password', label: 'Password' }, { value: 'otp', label: 'OTP' }, { value: 'both', label: 'Both' }] },
    {
      key: 'allow_guest_booking',
      label: 'Allow booking without signing in',
      type: 'select',
      options: [
        { value: '1', label: 'Yes (guests can use /book)' },
        { value: '0', label: 'No (customers must sign in first)' },
      ],
      hint: 'When set to No, the book wizard only accepts submissions from signed-in customers.',
    },
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

const CUSTOMER_LOGIN_MODES = new Set(['password', 'otp', 'both']);

function normalizeCustomerLoginValues(v: SectionValues): SectionValues {
  const out = { ...v };
  const enabled = out.customer_login_enabled?.trim();
  out.customer_login_enabled =
    enabled === '0' || enabled === '1' ? enabled : '0';
  const mode = out.customer_login_mode?.trim();
  out.customer_login_mode = CUSTOMER_LOGIN_MODES.has(mode ?? '')
    ? mode!
    : 'otp';
  const guest = out.allow_guest_booking?.trim();
  out.allow_guest_booking = guest === '0' || guest === '1' ? guest : '1';
  return out;
}

function SectionForm({ section }: { section: string }) {
  const fields = SECTION_FIELDS[section] ?? [];

  const q = useQuery({
    queryKey: ['staff', 'settings', 'section', section],
    queryFn: () => apiJson<SectionValues>(`/api/staff/settings/section/${section}`),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;

  let serverValues: SectionValues = Object.fromEntries(
    Object.entries(q.data ?? {}).map(([k, v]) => [k, v ?? '']),
  );
  if (section === 'customer-login') {
    serverValues = normalizeCustomerLoginValues(serverValues);
  }

  // key the inner form on the data identity so React remounts it (and resets
  // local state) when fresh server data arrives — avoids setState-in-effect.
  return (
    <>
      {q.isError && (
        <p className="text-sm text-amber-400">{(q.error as Error).message}</p>
      )}
      <SectionFormInner
        key={JSON.stringify(serverValues)}
        section={section}
        initialValues={serverValues}
        fields={fields}
      />
    </>
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
      if (
        section === 'customer-login' ||
        section === 'booking' ||
        section === 'general'
      ) {
        void qc.invalidateQueries({ queryKey: ['settings', 'public'] });
      }
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
    const payload =
      section === 'customer-login' ? normalizeCustomerLoginValues(values) : values;
    m.mutate(payload);
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
          {field.type === 'richtext' ? (
            <RichTextEditor
              value={values[field.key] ?? ''}
              onChange={(html) => setValues((v) => ({ ...v, [field.key]: html }))}
              minHeightClass="min-h-[180px]"
            />
          ) : field.type === 'textarea' ? (
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
          ) : field.type === 'fileSizeWithUnit' ? (
            <FileSizeInput
              valueMb={values[field.key]}
              onChange={(mbStr) => setValues((v) => ({ ...v, [field.key]: mbStr }))}
            />
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
    if (section && !VALID_SECTIONS.has(section)) {
      void navigate('/staff/settings/general', { replace: true });
    }
  }, [section, navigate]);

  const nav = NAV.find((n) => n.path === section);
  const title = section ? (SECTION_LABELS[section] ?? nav?.label ?? section) : '';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
      {section && <SectionForm section={section} />}
      {section === 'ldap' && <StaffLdapImportPanel />}
    </div>
  );
}

type IntegrationCardDef = {
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
};

const INTEGRATION_CARDS: IntegrationCardDef[] = [
  {
    label: 'Webhooks',
    description:
      'Send HTTP notifications to external apps when events occur — such as when an appointment is created, updated, or a customer is removed.',
    path: '/staff/settings/webhooks',
    icon: Webhook,
  },
  {
    label: 'Google Analytics',
    description:
      'Automatically inject a tracking tag into the public booking page to monitor session behaviour and conversion.',
    path: '/staff/settings/analytics',
    icon: BarChart3,
  },
  {
    label: 'Matomo Analytics',
    description:
      'Self-hosted, privacy-friendly analytics on the public booking page with no third-party data sharing.',
    path: '/staff/settings/matomo',
    icon: BarChart3,
  },
  {
    label: 'API',
    description:
      'Interact with all booking data over HTTP via the REST API and build custom integrations or automations.',
    path: '/staff/settings/api',
    icon: KeyRound,
  },
  {
    label: 'LDAP',
    description:
      'Connect to an LDAP directory to automatically import users and enable SSO with their directory password.',
    path: '/staff/settings/ldap',
    icon: Shield,
  },
  {
    label: 'Stripe',
    description:
      'Accept payments for appointments, configure down-payment rules, and manage billing via Stripe.',
    path: '/staff/settings/stripe',
    icon: CreditCard,
  },
  {
    label: 'Google Calendar',
    description:
      'Sync appointments with your Google Calendar to stay organised and avoid scheduling conflicts.',
    path: '/staff/account/integrations',
    icon: Calendar,
  },
  {
    label: 'GeoNames',
    description:
      'Import postal code data to enable ZIP validation, city autofill during booking, and geographic provider filtering by service area.',
    path: '/staff/settings/tools',
    icon: Globe,
  },
];

function IntegrationCard({ item }: { item: IntegrationCardDef }) {
  const Icon = item.icon;
  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800">
          <Icon className="h-4 w-4 text-zinc-400" aria-hidden />
        </span>
        <h3 className="text-sm font-semibold text-zinc-100">{item.label}</h3>
      </div>
      <p className="mb-5 flex-1 text-xs leading-relaxed text-zinc-500">{item.description}</p>
      <div>
        <NavLink
          to={item.path}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
        >
          Configure
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 3l5 5-5 5" />
          </svg>
        </NavLink>
      </div>
    </div>
  );
}

export function StaffSettingsIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-100">Integrations</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Connect OpenBook to external services and extend its capabilities.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {INTEGRATION_CARDS.map((item) => (
          <li key={item.label} className="flex">
            <IntegrationCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
