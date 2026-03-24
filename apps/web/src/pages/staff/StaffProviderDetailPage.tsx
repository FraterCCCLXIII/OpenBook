import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  CalendarDays,
  Clock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { apiJson } from '../../lib/api';
import { StaffWorkingPlanEditor } from '../../components/staff/StaffWorkingPlanEditor';
import { TIMEZONE_GROUPS } from '../../lib/timezones';

// ─── Types ──────────────────────────────────────────────────────────────────

type ProviderDetail = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  timezone: string | null;
  workingPlan: string | null;
  googleSync: boolean;
  googleCalendar: string | null;
  syncPastDays: number;
  syncFutureDays: number;
  serviceIds: string[];
};

type ServiceOption = { id: string; name: string | null };

type AppointmentRow = {
  id: string;
  startDatetime: string | null;
  serviceName: string | null;
  customerName: string | null;
  status: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Completed: 'bg-emerald-900/40 text-emerald-400',
    Booked: 'bg-blue-900/40 text-blue-400',
    'In progress': 'bg-amber-900/40 text-amber-400',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-zinc-700 text-zinc-300'}`}>
      {status}
    </span>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'hours' | 'services' | 'appointments';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'hours', label: 'Working Hours', icon: Clock },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export function StaffProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const q = useQuery({
    queryKey: ['staff', 'providers', id],
    queryFn: () =>
      apiJson<ProviderDetail>(`/api/staff/providers/${encodeURIComponent(id ?? '')}`),
    enabled: Boolean(id),
  });

  const services = useQuery({
    queryKey: ['staff', 'services'],
    queryFn: () =>
      apiJson<{ items: ServiceOption[] }>('/api/staff/services').then((r) => r.items),
  });

  const appointmentsQ = useQuery({
    queryKey: ['staff', 'providers', id, 'appointments'],
    queryFn: () =>
      apiJson<{ items: AppointmentRow[] }>(
        `/api/staff/providers/${encodeURIComponent(id ?? '')}/appointments`,
      ),
    enabled: Boolean(id) && activeTab === 'appointments',
  });

  const patchProvider = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiJson<ProviderDetail>(`/api/staff/providers/${encodeURIComponent(id ?? '')}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void qc.setQueryData(['staff', 'providers', id], data);
      void qc.invalidateQueries({ queryKey: ['staff', 'team', 'provider'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/team/provider/${encodeURIComponent(id ?? '')}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'team', 'provider'] });
      navigate('/staff/providers');
    },
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError)
    return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const provider = q.data;
  const name =
    [provider.firstName, provider.lastName].filter(Boolean).join(' ') || 'Provider';

  const inputCls =
    'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h1 className="text-xl font-semibold text-zinc-50">{name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
          {provider.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-zinc-600" />
              {provider.email}
            </span>
          )}
          {provider.phoneNumber && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-zinc-600" />
              {provider.phoneNumber}
            </span>
          )}
          {provider.googleSync && (
            <span className="text-emerald-500 text-xs">
              ✓ Google Calendar{provider.googleCalendar ? ` (${provider.googleCalendar})` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/30 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-zinc-700 text-zinc-50'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <form
          key={provider.id}
          className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            patchProvider.mutate({
              first_name: String(fd.get('first_name') ?? ''),
              last_name: String(fd.get('last_name') ?? ''),
              phone_number: String(fd.get('phone_number') ?? ''),
              timezone: String(fd.get('timezone') ?? ''),
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">First name</span>
              <input name="first_name" defaultValue={provider.firstName ?? ''} className={inputCls} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Last name</span>
              <input name="last_name" defaultValue={provider.lastName ?? ''} className={inputCls} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={provider.email ?? ''}
              disabled
              className={`${inputCls} opacity-50 cursor-not-allowed`}
              title="Email is managed via the team page"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Phone</span>
            <input name="phone_number" defaultValue={provider.phoneNumber ?? ''} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Timezone</span>
            <select name="timezone" defaultValue={provider.timezone ?? 'UTC'} className={inputCls}>
              {TIMEZONE_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {patchProvider.isError && (
            <p className="text-xs text-red-400">{(patchProvider.error as Error).message}</p>
          )}
          {patchProvider.isSuccess && (
            <p className="text-xs text-emerald-500">Saved.</p>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={patchProvider.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {patchProvider.isPending ? 'Saving…' : 'Save profile'}
            </button>
            <button
              type="button"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (confirm('Delete this provider? This cannot be undone.'))
                  deleteMut.mutate();
              }}
              className="rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete provider'}
            </button>
          </div>
          {deleteMut.isError && (
            <p className="text-xs text-red-400">{(deleteMut.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Working Hours tab */}
      {activeTab === 'hours' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
            <StaffWorkingPlanEditor
              workingPlanJson={provider.workingPlan}
              onWorkingPlanChange={(plan) => patchProvider.mutate({ working_plan: plan })}
            />
          </div>
          {patchProvider.isPending && (
            <p className="text-xs text-zinc-500">Saving…</p>
          )}
          {patchProvider.isSuccess && (
            <p className="text-xs text-emerald-500">Saved.</p>
          )}
        </div>
      )}

      {/* Services tab */}
      {activeTab === 'services' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Assigned services
          </h3>
          {services.isPending && <p className="text-sm text-zinc-500">Loading services…</p>}
          {services.isSuccess && services.data.length === 0 && (
            <p className="text-sm text-zinc-500">No services configured yet.</p>
          )}
          {services.isSuccess && services.data.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {services.data.map((s) => {
                  const checked = provider.serviceIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={checked}
                        className="accent-emerald-500"
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...provider.serviceIds, s.id]
                            : provider.serviceIds.filter((id) => id !== s.id);
                          patchProvider.mutate({ services: newIds });
                        }}
                      />
                      {s.name ?? s.id}
                    </label>
                  );
                })}
              </div>
              {patchProvider.isPending && (
                <p className="text-xs text-zinc-500">Saving…</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Appointments tab */}
      {activeTab === 'appointments' && (
        <div>
          {appointmentsQ.isPending && (
            <p className="text-sm text-zinc-500">Loading…</p>
          )}
          {appointmentsQ.isError && (
            <p className="text-sm text-red-400">
              {(appointmentsQ.error as Error).message}
            </p>
          )}
          {appointmentsQ.isSuccess && appointmentsQ.data.items.length === 0 && (
            <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
              No appointments yet.
            </p>
          )}
          {appointmentsQ.isSuccess && appointmentsQ.data.items.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5">Date &amp; Time</th>
                    <th className="px-4 py-2.5">Service</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {appointmentsQ.data.items.map((a) => (
                    <tr key={a.id} className="bg-zinc-900/20 hover:bg-zinc-900/50">
                      <td className="px-4 py-2.5 text-zinc-400">{fmt(a.startDatetime)}</td>
                      <td className="px-4 py-2.5 font-medium text-zinc-100">
                        {a.serviceName ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">{a.customerName ?? '—'}</td>
                      <td className="px-4 py-2.5">{statusBadge(a.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
