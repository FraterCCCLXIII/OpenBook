import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StaffMasterDetailLayout } from '../../components/staff/StaffMasterDetailLayout';
import {
  StaffRecordListPanel,
  StaffRecordPlaceholder,
} from '../../components/staff/StaffRecordListPanel';
import { apiJson } from '../../lib/api';

export { StaffCalendarPage } from './StaffCalendarPage';

function MessageBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
      {children}
    </div>
  );
}

type PaymentTransaction = {
  id: number;
  appointmentId: string;
  amount: string | null;
  currency: string | null;
  status: string;
  stripePaymentIntentId: string | null;
  createdAt: string | null;
  serviceName: string | null;
  customerName: string | null;
};

export function StaffBillingPage() {
  const qc = useQueryClient();
  const summary = useQuery({
    queryKey: ['staff', 'billing', 'summary'],
    queryFn: () =>
      apiJson<{
        ok: boolean;
        stripe: { configured: boolean; mode: string | null };
        payments: { succeededCount: number };
      }>('/api/staff/billing/summary'),
  });
  const transactions = useQuery({
    queryKey: ['staff', 'billing', 'transactions'],
    queryFn: () =>
      apiJson<{ items: PaymentTransaction[] }>('/api/staff/billing/transactions'),
  });

  const refundMut = useMutation({
    mutationFn: (paymentId: number) =>
      apiJson(`/api/staff/billing/refund/${paymentId}`, { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'billing'] });
    },
  });

  return (
    <MessageBlock title="Billing">
      {summary.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {summary.isError && (
        <p className="text-sm text-red-400">
          {(summary.error as Error).message}
        </p>
      )}
      {summary.isSuccess && (
        <div className="flex gap-4 text-sm">
          <div className="rounded border border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Stripe</p>
            <p className="text-zinc-300">
              {summary.data.stripe.configured ? '✓ Configured' : '✗ Not configured'}
              {summary.data.stripe.mode && ` (${summary.data.stripe.mode})`}
            </p>
          </div>
          <div className="rounded border border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Payments succeeded</p>
            <p className="text-2xl font-bold text-zinc-100">{summary.data.payments.succeededCount}</p>
          </div>
          <div className="self-end">
            <Link to="/staff/settings/stripe" className="text-sm text-emerald-500 underline">
              Stripe settings →
            </Link>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Transactions</h2>
        {transactions.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
        {transactions.isSuccess && transactions.data.items.length === 0 && (
          <p className="text-sm text-zinc-500">No transactions yet.</p>
        )}
        {transactions.isSuccess && transactions.data.items.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {transactions.data.items.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-800/80">
                    <td className="px-3 py-2 text-zinc-500">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2">{t.customerName ?? '—'}</td>
                    <td className="px-3 py-2">{t.serviceName ?? '—'}</td>
                    <td className="px-3 py-2">
                      {t.amount ? `${t.amount} ${(t.currency ?? '').toUpperCase()}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          t.status === 'succeeded'
                            ? 'text-emerald-400'
                            : t.status === 'refunded'
                              ? 'text-amber-400'
                              : 'text-zinc-500'
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {t.status === 'succeeded' && (
                        <button
                          type="button"
                          onClick={() => refundMut.mutate(t.id)}
                          disabled={refundMut.isPending}
                          className="text-xs text-red-400 hover:underline disabled:opacity-50"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MessageBlock>
  );
}

export function StaffLogsPage() {
  const q = useQuery({
    queryKey: ['staff', 'audit-logs'],
    queryFn: () => apiJson<{ items: Array<{ id: string; createdAt: string; action: string | null }> }>('/api/staff/audit-logs'),
  });

  return (
    <MessageBlock title="Logs">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && q.data.items.length === 0 && (
        <p className="text-sm text-zinc-500">No audit entries yet.</p>
      )}
      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="space-y-1 font-mono text-xs text-zinc-400">
          {q.data.items.map((l) => (
            <li key={l.id}>
              {l.createdAt} — {l.action ?? '—'}
            </li>
          ))}
        </ul>
      )}
    </MessageBlock>
  );
}

type ServiceRow = {
  id: string;
  name: string | null;
  duration: number | null;
  price: string | null;
};

function filterServices(items: ServiceRow[], q: string): ServiceRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter((item) => {
    const name = (item.name ?? '').toLowerCase();
    const meta = [item.duration != null ? `${item.duration} min` : '', item.price ?? '']
      .join(' ')
      .toLowerCase();
    return name.includes(s) || meta.includes(s);
  });
}

export function StaffServicesPage() {
  const q = useQuery({
    queryKey: ['staff', 'services'],
    queryFn: () =>
      apiJson<{ items: ServiceRow[] }>('/api/staff/services'),
  });

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (q.isSuccess ? filterServices(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  const selected = q.isSuccess ? q.data.items.find((s) => s.id === selectedId) : undefined;

  return (
    <StaffMasterDetailLayout
      panel={
        <StaffRecordListPanel
          id="filter-services"
          title="Services"
          searchValue={filter}
          onSearchChange={setFilter}
        >
          {q.isPending && (
            <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>
          )}
          {q.isError && (
            <p className="px-4 py-6 text-sm text-red-400">{(q.error as Error).message}</p>
          )}
          {q.isSuccess && filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-zinc-500">No matching services.</p>
          )}
          {q.isSuccess && filtered.length > 0 && (
            <ul className="divide-y divide-zinc-800">
              {filtered.map((s) => {
                const isSelected = selectedId === s.id;
                const meta = [
                  s.duration != null ? `${s.duration} min` : null,
                  s.price != null ? s.price : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={[
                        'w-full px-3.5 py-3.5 text-left transition-colors',
                        isSelected
                          ? 'border-l-[3px] border-emerald-500 bg-zinc-800/90 pl-[calc(0.875rem-3px)]'
                          : 'hover:bg-zinc-900/80',
                      ].join(' ')}
                      aria-pressed={isSelected}
                    >
                      <strong className="block text-sm font-semibold text-zinc-100">
                        {s.name ?? `Service ${s.id}`}
                      </strong>
                      {meta && (
                        <span className="mt-1 block text-xs leading-snug text-zinc-500">
                          {meta}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </StaffRecordListPanel>
      }
      detail={
        selected ? (
          <div className="mx-auto max-w-lg space-y-4">
            <h2 className="text-xl font-semibold text-zinc-50">
              {selected.name ?? `Service ${selected.id}`}
            </h2>
            <dl className="space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between gap-4 border-b border-zinc-800 py-2">
                <dt className="text-zinc-500">Duration</dt>
                <dd>{selected.duration != null ? `${selected.duration} min` : '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-zinc-800 py-2">
                <dt className="text-zinc-500">Price</dt>
                <dd>{selected.price ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-zinc-500">ID</dt>
                <dd className="font-mono text-xs text-zinc-400">{selected.id}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <StaffRecordPlaceholder message="Select a service from the list." />
        )
      }
    />
  );
}

type CategoryRow = { id: string; name: string | null; description: string | null };

function filterCategories(items: CategoryRow[], q: string): CategoryRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter((c) => {
    const name = (c.name ?? '').toLowerCase();
    const desc = (c.description ?? '').toLowerCase();
    return name.includes(s) || desc.includes(s);
  });
}

export function StaffServiceCategoriesPage() {
  const q = useQuery({
    queryKey: ['staff', 'service-categories'],
    queryFn: () =>
      apiJson<{ items: CategoryRow[] }>('/api/staff/service-categories'),
  });

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (q.isSuccess ? filterCategories(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  const selected = q.isSuccess ? q.data.items.find((c) => c.id === selectedId) : undefined;

  return (
    <StaffMasterDetailLayout
      panel={
        <StaffRecordListPanel
          id="filter-service-categories"
          title="Service categories"
          searchValue={filter}
          onSearchChange={setFilter}
        >
          {q.isPending && (
            <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>
          )}
          {q.isError && (
            <p className="px-4 py-6 text-sm text-red-400">{(q.error as Error).message}</p>
          )}
          {q.isSuccess && filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-zinc-500">No matching categories.</p>
          )}
          {q.isSuccess && filtered.length > 0 && (
            <ul className="divide-y divide-zinc-800">
              {filtered.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={[
                        'w-full px-3.5 py-3.5 text-left transition-colors',
                        isSelected
                          ? 'border-l-[3px] border-emerald-500 bg-zinc-800/90 pl-[calc(0.875rem-3px)]'
                          : 'hover:bg-zinc-900/80',
                      ].join(' ')}
                      aria-pressed={isSelected}
                    >
                      <strong className="block text-sm font-semibold text-zinc-100">
                        {c.name ?? '—'}
                      </strong>
                      {c.description && (
                        <span className="mt-1 line-clamp-2 block text-xs leading-snug text-zinc-500">
                          {c.description}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </StaffRecordListPanel>
      }
      detail={
        selected ? (
          <div className="mx-auto max-w-lg space-y-4">
            <h2 className="text-xl font-semibold text-zinc-50">{selected.name ?? '—'}</h2>
            {selected.description ? (
              <p className="text-sm leading-relaxed text-zinc-400">{selected.description}</p>
            ) : (
              <p className="text-sm text-zinc-500">No description.</p>
            )}
            <p className="font-mono text-xs text-zinc-600">ID: {selected.id}</p>
          </div>
        ) : (
          <StaffRecordPlaceholder message="Select a category from the list." />
        )
      }
    />
  );
}

type TeamRow = { id: string; displayName: string; email: string | null };

function filterTeam(items: TeamRow[], q: string): TeamRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (u) =>
      u.displayName.toLowerCase().includes(s) ||
      (u.email ?? '').toLowerCase().includes(s),
  );
}

function StaffTeamListPage({
  roleSlug,
  title,
  filterId,
}: {
  roleSlug: string;
  title: string;
  filterId: string;
}) {
  const q = useQuery({
    queryKey: ['staff', 'team', roleSlug],
    queryFn: () =>
      apiJson<{ items: TeamRow[] }>(`/api/staff/team/${roleSlug}`),
  });

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (q.isSuccess ? filterTeam(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  const selected = q.isSuccess ? q.data.items.find((u) => u.id === selectedId) : undefined;

  return (
    <StaffMasterDetailLayout
      panel={
        <StaffRecordListPanel
          id={filterId}
          title={title}
          searchValue={filter}
          onSearchChange={setFilter}
        >
          {q.isPending && (
            <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>
          )}
          {q.isError && (
            <p className="px-4 py-6 text-sm text-red-400">{(q.error as Error).message}</p>
          )}
          {q.isSuccess && filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-zinc-500">No matching users.</p>
          )}
          {q.isSuccess && filtered.length > 0 && (
            <ul className="divide-y divide-zinc-800">
              {filtered.map((u) => {
                const isSelected = selectedId === u.id;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(u.id)}
                      className={[
                        'w-full px-3.5 py-3.5 text-left transition-colors',
                        isSelected
                          ? 'border-l-[3px] border-emerald-500 bg-zinc-800/90 pl-[calc(0.875rem-3px)]'
                          : 'hover:bg-zinc-900/80',
                      ].join(' ')}
                      aria-pressed={isSelected}
                    >
                      <strong className="block text-sm font-semibold text-zinc-100">
                        {u.displayName}
                      </strong>
                      {u.email && (
                        <span className="mt-1 block text-xs leading-snug text-zinc-500">
                          {u.email}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </StaffRecordListPanel>
      }
      detail={
        selected ? (
          <div className="mx-auto max-w-lg space-y-4">
            <h2 className="text-xl font-semibold text-zinc-50">{selected.displayName}</h2>
            <dl className="space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between gap-4 border-b border-zinc-800 py-2">
                <dt className="text-zinc-500">Email</dt>
                <dd>{selected.email ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-zinc-500">ID</dt>
                <dd className="font-mono text-xs text-zinc-400">{selected.id}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <StaffRecordPlaceholder message="Select a user from the list." />
        )
      }
    />
  );
}

export const StaffSecretariesPage = () => (
  <StaffTeamListPage roleSlug="secretary" title="Secretaries" filterId="filter-secretaries" />
);
export const StaffAdminsPage = () => (
  <StaffTeamListPage roleSlug="admin" title="Administrators" filterId="filter-admins" />
);

export function StaffSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">Admin settings</h1>
      <p className="text-sm text-zinc-500">
        Choose a section. Values are patched via <code className="text-zinc-600">PATCH /api/staff/settings</code>.
      </p>
      <nav className="flex flex-wrap gap-2">
        {[
          ['general', 'General'],
          ['business', 'Business'],
          ['booking', 'Booking'],
          ['api', 'API'],
          ['stripe', 'Stripe'],
          ['service-areas', 'Service areas'],
          ['ldap', 'LDAP'],
        ].map(([path, label]) => (
          <Link
            key={path}
            to={`/staff/settings/${path}`}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
          >
            {label}
          </Link>
        ))}
      </nav>
      <p className="text-xs text-zinc-600">
        Tip: open <Link to="/staff/settings/general" className="text-emerald-500">General</Link> to edit
        company name and other keys from the full settings list.
      </p>
    </div>
  );
}

export function StaffAccountPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['staff', 'account'],
    queryFn: () =>
      apiJson<{ workingPlan: string | null; workingPlanExceptions: string | null }>(
        '/api/staff/account',
      ),
  });
  const save = useMutation({
    mutationFn: (body: { working_plan: string }) =>
      apiJson('/api/staff/account', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'account'] });
    },
  });

  return (
    <MessageBlock title="Account">
      <p className="text-sm text-zinc-500">
        Working plan JSON (parity with PHP <code className="text-zinc-600">ea_user_settings.working_plan</code>).
      </p>
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save.mutate({ working_plan: String(fd.get('working_plan') ?? '') });
          }}
        >
          <textarea
            name="working_plan"
            rows={12}
            defaultValue={q.data.workingPlan ?? '{}'}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100"
          />
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
          >
            {save.isPending ? 'Saving…' : 'Save working plan'}
          </button>
          {save.isSuccess && <p className="text-sm text-emerald-500">Saved.</p>}
        </form>
      )}

      <GoogleCalendarSection />
    </MessageBlock>
  );
}

function GoogleCalendarSection() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ['integrations', 'google', 'status'],
    queryFn: () =>
      apiJson<{ connected: boolean; calendarId: string | null }>(
        '/api/integrations/google/status',
      ),
  });

  const disconnect = useMutation({
    mutationFn: () =>
      apiJson('/api/integrations/google/disconnect', { method: 'DELETE' }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['integrations', 'google'] }),
  });

  function handleConnect() {
    window.location.href = '/api/integrations/google/auth';
  }

  return (
    <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-zinc-200">Google Calendar</h3>
      {status.isPending && <p className="text-xs text-zinc-500">Checking status…</p>}
      {status.isSuccess && (
        status.data.connected ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-emerald-400">✓ Connected{status.data.calendarId ? ` (${status.data.calendarId})` : ''}</span>
            <button
              type="button"
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
              className="rounded px-3 py-1 text-xs text-red-400 border border-red-900/50 hover:bg-red-900/20 disabled:opacity-50"
            >
              {disconnect.isPending ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Connect Google Calendar
          </button>
        )
      )}
    </div>
  );
}

export function StaffProviderBookingsPage() {
  const q = useQuery({
    queryKey: ['staff', 'provider-bookings'],
    queryFn: () =>
      apiJson<{
        items: Array<{
          id: string;
          startDatetime: string | null;
          serviceName: string | null;
          customerName: string | null;
        }>;
      }>('/api/staff/provider/bookings'),
  });

  return (
    <MessageBlock title="Provider bookings">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && q.data.items.length === 0 && (
        <p className="text-sm text-zinc-500">No bookings assigned to you.</p>
      )}
      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="space-y-2">
          {q.data.items.map((a) => (
            <li key={a.id}>
              <Link
                to={`/staff/provider/bookings/${a.id}`}
                className="block rounded border border-zinc-800 px-3 py-2 text-sm transition-colors hover:border-zinc-600"
              >
                <div className="text-zinc-100">{a.serviceName ?? 'Appointment'}</div>
                {a.startDatetime && (
                  <div className="text-xs text-zinc-500">{new Date(a.startDatetime).toLocaleString()}</div>
                )}
                {a.customerName && <div className="text-xs text-zinc-400">{a.customerName}</div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MessageBlock>
  );
}
