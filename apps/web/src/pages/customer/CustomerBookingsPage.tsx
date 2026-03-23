import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, ChevronRight } from 'lucide-react';
import { apiJson } from '../../lib/api';
import { Button, Card, FormField, Input } from '../../components/ui';

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
  if (!res.ok) throw new Error('Failed to load appointments');
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
    mutationFn: (body: {
      serviceId: string;
      providerId: string;
      startDatetime: string;
      notes: string;
    }) =>
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

  const selectClass =
    'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <Card className="w-full max-w-md">
        <h2 id="new-booking-title" className="mb-5 text-lg font-semibold text-slate-900">
          Book a New Appointment
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Service" htmlFor="service" required>
            <select
              id="service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">— select a service —</option>
              {services.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? s.id}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Provider" htmlFor="provider" required>
            <select
              id="provider"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              required
              disabled={!serviceId}
              className={selectClass}
            >
              <option value="">— select a provider —</option>
              {providers.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Date & Time" htmlFor="start-datetime" required>
            <Input
              id="start-datetime"
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Notes (optional)" htmlFor="notes">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Any additional notes…"
            />
          </FormField>

          {m.isError && (
            <p className="text-sm text-red-600" role="alert">
              {(m.error as Error).message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={m.isPending} className="flex-1">
              {m.isPending ? 'Booking…' : 'Confirm Booking'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CustomerBookingsPage() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const q = useQuery({
    queryKey: ['customer', 'appointments'],
    queryFn: fetchAppointments,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t('my_bookings')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your upcoming and past appointments.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Book appointment
        </Button>
      </div>

      {showModal && <NewBookingModal onClose={() => setShowModal(false)} />}

      {q.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}
      {q.isError && (
        <p className="text-sm text-red-600" role="alert">
          {(q.error as Error).message}
        </p>
      )}

      {q.isSuccess && q.data.items.length === 0 && (
        <Card className="py-14 text-center">
          <CalendarPlus className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500">No bookings yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setShowModal(true)}
          >
            Book your first appointment
          </Button>
        </Card>
      )}

      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="space-y-2" aria-label="Appointments">
          {q.data.items.map((a) => (
            <li key={a.id}>
              <Link
                to={`/customer/bookings/${a.id}`}
                className="flex items-center justify-between rounded-card border border-slate-200 bg-surface-card px-5 py-4 shadow-card transition-all hover:border-brand hover:shadow-md"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {a.serviceName ?? 'Appointment'}
                  </div>
                  {a.providerName && (
                    <div className="mt-0.5 text-xs text-slate-500">
                      With {a.providerName}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {a.startDatetime && (
                    <span className="text-xs text-slate-400">
                      {formatDateTime(a.startDatetime)}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
