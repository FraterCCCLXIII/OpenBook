import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiJson } from '../../lib/api';

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

type ServiceOption = { id: string; name: string | null };
type ProviderOption = { id: string; displayName: string };

function NewBookingModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [serviceId, setServiceId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [notes, setNotes] = useState('');

  const services = useQuery({
    queryKey: ['booking', 'services'],
    queryFn: () => fetch('/api/booking/services').then((r) => r.json() as Promise<ServiceOption[]>),
  });

  const providers = useQuery({
    queryKey: ['booking', 'providers', serviceId],
    queryFn: () =>
      fetch(`/api/booking/services/${serviceId}/providers`).then(
        (r) => r.json() as Promise<ProviderOption[]>,
      ),
    enabled: Boolean(serviceId),
  });

  const m = useMutation({
    mutationFn: (body: { serviceId: string; providerId: string; startDatetime: string; notes: string }) =>
      apiJson('/api/customer/appointments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'appointments'] });
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !providerId || !startDatetime) return;
    m.mutate({ serviceId, providerId, startDatetime, notes });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Book a New Appointment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Service</span>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">— select —</option>
              {services.data?.map((s) => (
                <option key={s.id} value={s.id}>{s.name ?? s.id}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Provider</span>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              required
              disabled={!serviceId}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
            >
              <option value="">— select —</option>
              {providers.data?.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Date &amp; Time</span>
            <input
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          {m.isError && (
            <p className="text-sm text-red-400">{(m.error as Error).message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={m.isPending}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {m.isPending ? 'Booking…' : 'Confirm Booking'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomerBookingsPage() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const q = useQuery({
    queryKey: ['customer', 'appointments'],
    queryFn: fetchAppointments,
  });

  return (
    <div className="min-h-[40vh]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-50">{t('my_bookings')}</h1>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + Book Appointment
        </button>
      </div>
      {showModal && <NewBookingModal onClose={() => setShowModal(false)} />}

      <p className="mt-2 text-zinc-400">Your upcoming and past appointments.</p>

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
