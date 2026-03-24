import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StaffWorkingPlanEditor } from '../../components/staff/StaffWorkingPlanEditor';
import { StaffMasterDetailLayout } from '../../components/staff/StaffMasterDetailLayout';
import {
  StaffRecordListPanel,
  StaffRecordPlaceholder,
} from '../../components/staff/StaffRecordListPanel';
import { apiJson } from '../../lib/api';
import { TIMEZONE_GROUPS } from '../../lib/timezones';

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
  stripeCheckoutSessionId: string | null;
  createdAt: string | null;
  serviceName: string | null;
  customerName: string | null;
};

export function StaffBillingPage() {
  const qc = useQueryClient();
  const [refundError, setRefundError] = useState<string | null>(null);
  const summary = useQuery({
    queryKey: ['staff', 'billing', 'summary'],
    queryFn: () =>
      apiJson<{
        ok: boolean;
        stripe: { configured: boolean; mode: string | null };
        payments: {
          succeededCount: number;
          pendingCount?: number;
          refundedCount?: number;
          failedCount?: number;
          totalCount?: number;
        };
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
      setRefundError(null);
      void qc.invalidateQueries({ queryKey: ['staff', 'billing'] });
    },
    onError: (e) => {
      setRefundError(e instanceof Error ? e.message : 'Refund failed');
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
            <p className="text-xs text-zinc-500">Payments (succeeded / pending / refunded)</p>
            <p className="text-lg font-bold text-zinc-100">
              {summary.data.payments.succeededCount}
              {summary.data.payments.pendingCount != null && (
                <span className="text-zinc-500">
                  {' '}
                  / {summary.data.payments.pendingCount} /{' '}
                  {summary.data.payments.refundedCount ?? 0}
                </span>
              )}
            </p>
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
        {refundError && (
          <p className="mb-2 text-sm text-red-400" role="alert">
            {refundError}
          </p>
        )}
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
                  <th className="px-3 py-2">Stripe</th>
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
                    <td className="max-w-[140px] truncate px-3 py-2 font-mono text-[10px] text-zinc-500">
                      {t.stripePaymentIntentId ?? t.stripeCheckoutSessionId ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {t.status === 'succeeded' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              !window.confirm(
                                'Issue a full refund in Stripe for this payment?',
                              )
                            ) {
                              return;
                            }
                            setRefundError(null);
                            refundMut.mutate(t.id);
                          }}
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

type TeamRow = {
  id: string;
  displayName: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

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
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['staff', 'team', roleSlug],
    queryFn: () =>
      apiJson<{ items: TeamRow[] }>(`/api/staff/team/${roleSlug}`),
  });

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(
    () => (q.isSuccess ? filterTeam(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  const selected = q.isSuccess ? q.data.items.find((u) => u.id === selectedId) : undefined;

  const createMut = useMutation({
    mutationFn: (body: {
      firstName: string;
      lastName: string;
      email: string;
      username: string;
      password: string;
    }) =>
      apiJson(`/api/staff/team/${roleSlug}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'team', roleSlug] });
      setShowCreate(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (args: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    }) =>
      apiJson(`/api/staff/team/${roleSlug}/${args.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'team', roleSlug] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/staff/team/${roleSlug}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'team', roleSlug] });
      setSelectedId(null);
    },
  });

  function CreateTeamUserModal() {
    if (!showCreate) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            New {roleSlug.charAt(0).toUpperCase() + roleSlug.slice(1)}
          </h3>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMut.mutate({
                firstName: String(fd.get('first_name') ?? ''),
                lastName: String(fd.get('last_name') ?? ''),
                email: String(fd.get('email') ?? ''),
                username: String(fd.get('username') ?? ''),
                password: String(fd.get('password') ?? ''),
              });
            }}
          >
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">First name</span>
              <input name="first_name" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Last name</span>
              <input name="last_name" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Email *</span>
              <input name="email" type="email" required className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Username *</span>
              <input name="username" required autoComplete="username" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Password *</span>
              <input name="password" type="password" required autoComplete="new-password" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            {createMut.isError && (
              <p className="text-xs text-red-400">{(createMut.error as Error).message}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={createMut.isPending}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {createMut.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <StaffMasterDetailLayout
        panel={
          <StaffRecordListPanel
            id={filterId}
            title={title}
            searchValue={filter}
            onSearchChange={setFilter}
            headerExtra={
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-lg border border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-950/50"
              >
                + Add
              </button>
            }
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
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  updateMut.mutate({
                    id: selected.id,
                    firstName: String(fd.get('first_name') ?? ''),
                    lastName: String(fd.get('last_name') ?? ''),
                    email: String(fd.get('email') ?? ''),
                  });
                }}
              >
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">First name</span>
                  <input
                    name="first_name"
                    key={selected.id}
                    defaultValue={selected.firstName ?? ''}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Last name</span>
                  <input
                    name="last_name"
                    defaultValue={selected.lastName ?? ''}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-500">Email</span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={selected.email ?? ''}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={updateMut.isPending}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {updateMut.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      if (window.confirm('Delete this user? This cannot be undone.')) {
                        deleteMut.mutate(selected.id);
                      }
                    }}
                    className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 hover:border-red-700 disabled:opacity-50"
                  >
                    {deleteMut.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
                {updateMut.isError && (
                  <p className="text-xs text-red-400">{(updateMut.error as Error).message}</p>
                )}
                {deleteMut.isError && (
                  <p className="text-xs text-red-400">{(deleteMut.error as Error).message}</p>
                )}
              </form>
              <p className="font-mono text-xs text-zinc-500">ID {selected.id}</p>
            </div>
          ) : (
            <StaffRecordPlaceholder message="Select a user from the list." />
          )
        }
      />
      <CreateTeamUserModal />
    </>
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

type StaffAccountDto = {
  workingPlan: string | null;
  workingPlanExceptions: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  timezone: string | null;
  language: string | null;
};

export function StaffAccountPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['staff', 'account'],
    queryFn: () => apiJson<StaffAccountDto>('/api/staff/account'),
  });

  const [workingPlan, setWorkingPlan] = useState('');
  const [exceptions, setExceptions] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.data) return;
    setWorkingPlan(q.data.workingPlan ?? '{}');
    setExceptions(q.data.workingPlanExceptions ?? '{}');
    setFirstName(q.data.firstName ?? '');
    setLastName(q.data.lastName ?? '');
    setEmail(q.data.email ?? '');
    setPhoneNumber(q.data.phoneNumber ?? '');
    setAddress(q.data.address ?? '');
    setCity(q.data.city ?? '');
    setState(q.data.state ?? '');
    setZipCode(q.data.zipCode ?? '');
    setTimezone(q.data.timezone ?? '');
    setLanguage(q.data.language ?? '');
  }, [q.data]);

  const timezoneOptions = useMemo(
    () => TIMEZONE_GROUPS.flatMap((g) => g.options),
    [],
  );

  const save = useMutation({
    mutationFn: (body: Record<string, string | null | undefined>) =>
      apiJson('/api/staff/account', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'account'] });
      setFormError(null);
    },
    onError: (e) => {
      setFormError(e instanceof Error ? e.message : 'Save failed');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (exceptions.trim()) {
      try {
        JSON.parse(exceptions);
      } catch {
        setFormError('Working plan exceptions must be valid JSON (or empty).');
        return;
      }
    }
    try {
      JSON.parse(workingPlan || '{}');
    } catch {
      setFormError('Working plan must be valid JSON.');
      return;
    }
    save.mutate({
      working_plan: workingPlan,
      working_plan_exceptions: exceptions.trim() || null,
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone_number: phoneNumber || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      timezone: timezone || null,
      language: language || null,
    });
  }

  return (
    <MessageBlock title="Account">
      <p className="text-sm text-zinc-500">
        Profile, weekly availability, and exceptions — aligned with{' '}
        <code className="text-zinc-600">ea_users</code> and{' '}
        <code className="text-zinc-600">ea_user_settings</code> (PHP account / availability).
      </p>
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-300">Profile</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">First name</span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">Last name</span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs uppercase text-zinc-500">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">Phone</span>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs uppercase text-zinc-500">Address</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">City</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">State</span>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">ZIP</span>
                <input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">Timezone</span>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">— Default / browser —</option>
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">Language</span>
                <input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. english"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-300">Working hours</h2>
            <p className="text-xs text-zinc-500">
              Stored as JSON with <code className="text-zinc-600">breaks: []</code> per active day.
              Edit breaks or advanced keys in your database if needed.
            </p>
            <StaffWorkingPlanEditor
              workingPlanJson={workingPlan}
              onWorkingPlanChange={setWorkingPlan}
            />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-300">Working plan exceptions</h2>
            <p className="text-xs text-zinc-500">
              JSON object for date-specific overrides (same format as PHP{' '}
              <code className="text-zinc-600">working_plan_exceptions</code>).
            </p>
            <textarea
              value={exceptions}
              onChange={(e) => setExceptions(e.target.value)}
              rows={6}
              spellCheck={false}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100"
            />
          </section>

          {formError && (
            <p className="text-sm text-red-400" role="alert">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save account'}
            </button>
            {save.isSuccess && !save.isPending && (
              <p className="text-sm text-emerald-500">Saved.</p>
            )}
          </div>
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
