import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type AppointmentRow = {
  id: string;
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
  serviceName: string | null;
  providerName: string | null;
};

async function fetchAppointments(): Promise<{ items: AppointmentRow[] }> {
  const res = await fetch('/api/customer/appointments', { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to load appointments');
  }
  return res.json() as Promise<{ items: AppointmentRow[] }>;
}

export function CustomerBookingsPage() {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ['customer', 'appointments'],
    queryFn: fetchAppointments,
  });

  return (
    <div className="min-h-[40vh]">
      <h1 className="text-2xl font-semibold text-zinc-50">{t('my_bookings')}</h1>
      <p className="mt-2 text-zinc-400">
        Appointments from the Nest API (parity with PHP <code className="text-zinc-500">customer/bookings</code>).
      </p>

      {q.isPending && <p className="mt-6 text-sm text-zinc-500">Loading…</p>}
      {q.isError && (
        <p className="mt-6 text-sm text-red-400">{(q.error as Error).message}</p>
      )}

      {q.isSuccess && q.data.items.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
          No bookings yet.
        </div>
      )}

      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="mt-6 space-y-3">
          {q.data.items.map((a) => (
            <li key={a.id}>
              <Link
                to={`/customer/bookings/${a.id}`}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-200 transition-colors hover:border-zinc-600"
              >
                <div className="font-medium text-zinc-100">
                  {a.serviceName ?? 'Appointment'}{' '}
                  {a.startDatetime && (
                    <span className="font-normal text-zinc-400">
                      · {new Date(a.startDatetime).toLocaleString()}
                    </span>
                  )}
                </div>
                {a.providerName && (
                  <div className="mt-1 text-xs text-zinc-500">With {a.providerName}</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
