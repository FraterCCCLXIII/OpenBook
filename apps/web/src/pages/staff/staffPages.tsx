import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
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

type CustomerRow = { id: string; firstName: string | null; lastName: string | null; email: string | null };

function EditCustomerModal({ customer, onClose }: { customer: CustomerRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [first, setFirst] = useState(customer.firstName ?? '');
  const [last, setLast] = useState(customer.lastName ?? '');
  const [email, setEmail] = useState(customer.email ?? '');

  const m = useMutation({
    mutationFn: (body: { first_name: string; last_name: string; email: string }) =>
      apiJson(`/api/staff/customers/${customer.id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Edit Customer</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); m.mutate({ first_name: first, last_name: last, email }); }}
          className="space-y-3"
        >
          {[
            { label: 'First name', value: first, set: setFirst, type: 'text' },
            { label: 'Last name', value: last, set: setLast, type: 'text' },
            { label: 'Email', value: email, set: setEmail, type: 'email', required: true },
          ].map(({ label, value, set, type, required }) => (
            <label key={label} className="block space-y-1">
              <span className="text-xs uppercase text-zinc-500">{label}</span>
              <input
                type={type}
                value={value}
                onChange={(e) => set(e.target.value)}
                required={required}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
              />
            </label>
          ))}
          {m.isError && <p className="text-xs text-red-400">{(m.error as Error).message}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={m.isPending}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50">
              {m.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffCustomersPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [editing, setEditing] = useState<CustomerRow | null>(null);

  const q = useQuery({
    queryKey: ['staff', 'customers'],
    queryFn: () =>
      apiJson<{ items: CustomerRow[] }>('/api/staff/customers'),
  });

  const createM = useMutation({
    mutationFn: (body: { first_name: string; last_name: string; email: string }) =>
      apiJson('/api/staff/customers', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      setShowNew(false);
      setNewFirst(''); setNewLast(''); setNewEmail('');
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/staff/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['staff', 'customers'] }),
  });

  return (
    <MessageBlock title="Customers">
      {editing && <EditCustomerModal customer={editing} onClose={() => setEditing(null)} />}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + New Customer
        </button>
      </div>

      {showNew && (
        <form
          onSubmit={(e) => { e.preventDefault(); createM.mutate({ first_name: newFirst, last_name: newLast, email: newEmail }); }}
          className="flex flex-wrap gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 p-4"
        >
          <input value={newFirst} onChange={(e) => setNewFirst(e.target.value)} placeholder="First name"
            className="flex-1 min-w-[120px] rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100" />
          <input value={newLast} onChange={(e) => setNewLast(e.target.value)} placeholder="Last name"
            className="flex-1 min-w-[120px] rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email *" required type="email"
            className="flex-1 min-w-[180px] rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100" />
          <button type="submit" disabled={createM.isPending}
            className="rounded bg-emerald-600 px-4 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50">
            {createM.isPending ? 'Saving…' : 'Save'}
          </button>
          {createM.isError && <p className="w-full text-xs text-red-400">{(createM.error as Error).message}</p>}
        </form>
      )}

      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {q.data.items.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800/80">
                  <td className="px-3 py-2">
                    <Link
                      to={`/staff/customers/${c.id}`}
                      className="text-emerald-400 hover:underline"
                    >
                      {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{c.email ?? '—'}</td>
                  <td className="px-3 py-2 text-right flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="rounded px-2 py-0.5 text-xs text-blue-400 hover:bg-blue-900/30"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirm('Delete this customer?')) deleteM.mutate(c.id); }}
                      className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-900/30"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MessageBlock>
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

export function StaffServicesPage() {
  const q = useQuery({
    queryKey: ['staff', 'services'],
    queryFn: () =>
      apiJson<{
        items: Array<{ id: string; name: string | null; duration: number | null; price: string | null }>;
      }>('/api/staff/services'),
  });

  return (
    <MessageBlock title="Services">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <ul className="space-y-2">
          {q.data.items.map((s) => (
            <li key={s.id} className="rounded border border-zinc-800 px-3 py-2 text-sm">
              <span className="text-zinc-100">{s.name ?? `Service ${s.id}`}</span>
              <span className="ml-2 text-zinc-500">
                {s.duration != null ? `${s.duration} min` : ''}
                {s.price != null ? ` · ${s.price}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </MessageBlock>
  );
}

export function StaffServiceCategoriesPage() {
  const q = useQuery({
    queryKey: ['staff', 'service-categories'],
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; name: string | null; description: string | null }> }>(
        '/api/staff/service-categories',
      ),
  });

  return (
    <MessageBlock title="Service categories">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <ul className="space-y-2">
          {q.data.items.map((c) => (
            <li key={c.id} className="rounded border border-zinc-800 px-3 py-2 text-sm text-zinc-200">
              {c.name ?? '—'}
              {c.description && <p className="text-xs text-zinc-500">{c.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </MessageBlock>
  );
}

function TeamListPage({ roleSlug, title }: { roleSlug: string; title: string }) {
  const q = useQuery({
    queryKey: ['staff', 'team', roleSlug],
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; displayName: string; email: string | null }> }>(
        `/api/staff/team/${roleSlug}`,
      ),
  });

  return (
    <MessageBlock title={title}>
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <ul className="space-y-2">
          {q.data.items.map((u) => (
            <li key={u.id} className="rounded border border-zinc-800 px-3 py-2 text-sm text-zinc-200">
              {u.displayName}
              {u.email && <span className="ml-2 text-zinc-500">{u.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </MessageBlock>
  );
}

export function StaffProvidersPage() {
  const q = useQuery({
    queryKey: ['staff', 'team', 'provider'],
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; displayName: string; email: string | null }> }>(
        '/api/staff/team/provider',
      ),
  });

  return (
    <MessageBlock title="Providers">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <ul className="space-y-2">
          {q.data.items.map((u) => (
            <li key={u.id} className="rounded border border-zinc-800 px-3 py-2 text-sm text-zinc-200 flex items-center justify-between">
              <span>{u.displayName}{u.email && <span className="ml-2 text-zinc-500">{u.email}</span>}</span>
              <Link to={`/staff/providers/${u.id}`} className="text-xs text-emerald-400 hover:underline">
                Edit →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MessageBlock>
  );
}

export const StaffSecretariesPage = () => <TeamListPage roleSlug="secretary" title="Secretaries" />;
export const StaffAdminsPage = () => <TeamListPage roleSlug="admin" title="Administrators" />;

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
