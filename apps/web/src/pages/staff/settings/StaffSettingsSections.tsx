import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiJson } from '../../../lib/api';

type SettingRow = { name: string; value: string | null };

async function fetchStaffSettings(): Promise<SettingRow[]> {
  return apiJson<SettingRow[]>('/api/staff/settings');
}

const NAV = [
  { path: 'general', label: 'General' },
  { path: 'business', label: 'Business' },
  { path: 'booking', label: 'Booking' },
  { path: 'api', label: 'API' },
  { path: 'stripe', label: 'Stripe' },
  { path: 'service-areas', label: 'Service areas' },
  { path: 'ldap', label: 'LDAP' },
] as const;

export function StaffSettingsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Admin settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sections mirror the PHP fork. Patches use <code className="text-zinc-600">PATCH /api/staff/settings</code>.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {NAV.map((n) => (
          <Link
            key={n.path}
            to={`/staff/settings/${n.path}`}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-emerald-600"
          >
            {n.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}

function useSettingMutate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; value: string }) => {
      return apiJson<SettingRow>('/api/staff/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'settings'] });
    },
  });
}

function SingleFieldSection({
  title,
  settingName,
  label,
  placeholder,
}: {
  title: string;
  settingName: string;
  label: string;
  placeholder?: string;
}) {
  const q = useQuery({ queryKey: ['staff', 'settings'], queryFn: fetchStaffSettings });
  const m = useSettingMutate();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (q.data) {
      const row = q.data.find((s) => s.name === settingName);
      setValue(row?.value ?? '');
    }
  }, [q.data, settingName]);

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-medium text-zinc-100">{title}</h2>
      {q.isPending && <p className="text-sm text-zinc-500">Loading settings…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <>
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">{label}</span>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              value={value}
              placeholder={placeholder}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={m.isPending}
            onClick={() => m.mutate({ name: settingName, value })}
          >
            Save
          </button>
          {m.isError && <p className="text-sm text-red-400">{(m.error as Error).message}</p>}
          {m.isSuccess && <p className="text-sm text-emerald-500">Saved.</p>}
        </>
      )}
    </div>
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

  switch (section) {
    case 'general':
      return (
        <SingleFieldSection
          title="General"
          settingName="company_name"
          label="Company name"
          placeholder="Your business name"
        />
      );
    case 'business':
      return (
        <SingleFieldSection
          title="Business"
          settingName="company_email"
          label="Company email"
          placeholder="contact@example.com"
        />
      );
    case 'booking':
      return (
        <div className="max-w-xl space-y-4">
          <h2 className="text-lg font-medium text-zinc-100">Booking</h2>
          <p className="text-sm text-zinc-500">
            Edit <code className="text-zinc-600">book_advance_timeout</code> and{' '}
            <code className="text-zinc-600">future_booking_limit</code> via PATCH (add fields here as needed).
          </p>
        </div>
      );
    case 'api':
      return (
        <div className="max-w-xl space-y-2">
          <h2 className="text-lg font-medium text-zinc-100">API</h2>
          <p className="text-sm text-zinc-500">
            REST v1 bearer tokens are managed in PHP parity; Nest exposes <code className="text-zinc-600">/api/v1/ping</code>{' '}
            today. Expand in roadmap Phase E.
          </p>
        </div>
      );
    case 'stripe':
      return (
        <div className="max-w-xl space-y-2">
          <h2 className="text-lg font-medium text-zinc-100">Stripe</h2>
          <p className="text-sm text-zinc-500">
            Connect Stripe keys in settings storage when billing module is enabled (Phase E).
          </p>
        </div>
      );
    case 'service-areas':
      return (
        <div className="max-w-xl space-y-2">
          <h2 className="text-lg font-medium text-zinc-100">Service areas</h2>
          <p className="text-sm text-zinc-500">Fork-specific feature — port GeoNames / area rules from PHP when required.</p>
        </div>
      );
    case 'ldap':
      return (
        <div className="max-w-xl space-y-2">
          <h2 className="text-lg font-medium text-zinc-100">LDAP</h2>
          <p className="text-sm text-zinc-500">LDAP integration settings will mirror PHP <code className="text-zinc-600">ldap_settings</code>.</p>
        </div>
      );
    default:
      return null;
  }
}
