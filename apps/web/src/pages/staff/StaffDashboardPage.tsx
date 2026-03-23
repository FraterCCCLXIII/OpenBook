import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiJson } from '../../lib/api';

type DashboardStats = {
  todayAppointments: number;
  upcomingAppointments: number;
  totalCustomers: number;
  recentAppointments: Array<{
    id: string;
    startDatetime: string | null;
    serviceName: string | null;
    customerName: string | null;
    providerName: string | null;
  }>;
};

function StatCard({ label, value, to }: { label: string; value: number | string; to?: string }) {
  const inner = (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-600">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-50">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export function StaffDashboardPage() {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ['staff', 'dashboard', 'stats'],
    queryFn: () => apiJson<DashboardStats>('/api/staff/dashboard/stats'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">{t('dashboard')}</h1>
        <p className="mt-1 text-sm text-zinc-500">Overview of today's activity.</p>
      </div>

      {q.isError && (
        <p className="text-sm text-red-400">{(q.error as Error).message}</p>
      )}

      {q.isPending && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      )}

      {q.isSuccess && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Today's appointments"
              value={q.data.todayAppointments}
              to="/staff/calendar"
            />
            <StatCard
              label="Upcoming (7 days)"
              value={q.data.upcomingAppointments}
              to="/staff/calendar"
            />
            <StatCard
              label="Total customers"
              value={q.data.totalCustomers}
              to="/staff/customers"
            />
          </div>

          {q.data.recentAppointments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-zinc-400">Next appointments</h2>
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Service</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data.recentAppointments.map((a) => (
                      <tr key={a.id} className="border-b border-zinc-800/80">
                        <td className="px-3 py-2 text-zinc-400">
                          {a.startDatetime
                            ? new Date(a.startDatetime).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-3 py-2">{a.serviceName ?? '—'}</td>
                        <td className="px-3 py-2">{a.customerName ?? '—'}</td>
                        <td className="px-3 py-2 text-zinc-500">{a.providerName ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { to: '/staff/services', label: 'Services' },
              { to: '/staff/billing', label: 'Billing' },
              { to: '/staff/logs', label: 'Audit logs' },
              { to: '/staff/settings', label: 'Settings' },
              { to: '/staff/forms', label: 'Forms' },
            ].map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
              >
                {card.label} →
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
