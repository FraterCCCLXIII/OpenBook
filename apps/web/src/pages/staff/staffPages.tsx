import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function StaffCustomersPage() {
  const q = useQuery({
    queryKey: ['staff', 'customers'],
    queryFn: () =>
      apiJson<{
        items: Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null }>;
      }>('/api/staff/customers'),
  });

  return (
    <MessageBlock title="Customers">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MessageBlock>
  );
}

export function StaffBillingPage() {
  const summary = useQuery({
    queryKey: ['staff', 'billing', 'summary'],
    queryFn: () =>
      apiJson<{
        ok: boolean;
        stripe: { configured: boolean; mode: string | null };
        message: string;
      }>('/api/staff/billing/summary'),
  });
  const queue = useQuery({
    queryKey: ['staff', 'system', 'queue'],
    queryFn: () =>
      apiJson<{
        redisUrlConfigured: boolean;
        status: string;
        hint: string;
      }>('/api/staff/system/queue'),
  });

  return (
    <MessageBlock title="Billing">
      {summary.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {summary.isError && (
        <p className="text-sm text-red-400">
          {(summary.error as Error).message} (admins only for billing summary.)
        </p>
      )}
      {summary.isSuccess && (
        <div className="space-y-2 text-sm text-zinc-300">
          <p>{summary.data.message}</p>
          <p className="text-zinc-500">
            Stripe configured: {summary.data.stripe.configured ? 'yes' : 'no'}
            {summary.data.stripe.mode && ` (${summary.data.stripe.mode})`}
          </p>
          <Link to="/staff/settings/stripe" className="text-emerald-500 underline">
            Stripe settings
          </Link>
        </div>
      )}
      <div className="mt-6 border-t border-zinc-800 pt-4">
        <h2 className="text-sm font-medium text-zinc-400">Job queue</h2>
        {queue.isPending && <p className="text-sm text-zinc-500">Checking queue…</p>}
        {queue.isError && (
          <p className="text-sm text-red-400">{(queue.error as Error).message}</p>
        )}
        {queue.isSuccess && (
          <p className="text-sm text-zinc-500">
            {queue.data.hint} (status: {queue.data.status})
          </p>
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

export const StaffProvidersPage = () => <TeamListPage roleSlug="provider" title="Providers" />;
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
    </MessageBlock>
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
