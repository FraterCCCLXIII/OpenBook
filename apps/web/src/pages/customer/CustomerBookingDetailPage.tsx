import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarDays, Pencil, User, X } from 'lucide-react';
import { apiJson } from '../../lib/api';
import { Button, Card, FormField, Input } from '../../components/ui';

type Appt = {
  id: string;
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
  serviceName: string | null;
  providerName: string | null;
  servicePrice?: string | null;
  serviceCurrency?: string | null;
  latestPayment?: {
    status: string;
    amount: string | null;
    currency: string | null;
  } | null;
  canPayWithStripe?: boolean;
};

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const q = useQuery({
    queryKey: ['customer', 'appointments', id],
    queryFn: () => apiJson<Appt>(`/api/customer/appointments/${encodeURIComponent(id ?? '')}`),
    enabled: Boolean(id),
  });

  const cancel = useMutation({
    mutationFn: () =>
      fetch(`/api/customer/appointments/${encodeURIComponent(id ?? '')}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then((res) => {
        if (!res.ok) throw new Error('Could not cancel appointment');
        return res.json();
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'appointments'] });
      navigate('/customer/bookings');
    },
  });

  const update = useMutation({
    mutationFn: (body: { startDatetime?: string; notes?: string }) =>
      apiJson<Appt>(`/api/customer/appointments/${encodeURIComponent(id ?? '')}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void qc.setQueryData(['customer', 'appointments', id], data);
      void qc.invalidateQueries({ queryKey: ['customer', 'appointments'] });
      setEditing(false);
    },
  });

  const checkout = useMutation({
    mutationFn: () =>
      apiJson<{ url: string | null }>('/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: id,
          successUrl: `${window.location.origin}/customer/bookings/${id}`,
          cancelUrl: `${window.location.origin}/customer/bookings/${id}`,
        }),
      }),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  function openEdit(appt: Appt) {
    setEditStart(toLocalDatetimeValue(appt.startDatetime));
    setEditNotes(appt.notes ?? '');
    setEditing(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: { startDatetime?: string; notes?: string } = {};
    if (editStart) body.startDatetime = new Date(editStart).toISOString();
    body.notes = editNotes;
    update.mutate(body);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        to="/customer/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to bookings
      </Link>

      {q.isPending && <p className="text-sm text-slate-400">Loading…</p>}
      {q.isError && (
        <p className="text-sm text-red-600" role="alert">
          {(q.error as Error).message}
        </p>
      )}

      {q.isSuccess && (
        <>
          <Card>
            <h1 className="text-xl font-semibold text-slate-900">
              {q.data.serviceName ?? 'Appointment'}
            </h1>

            <dl className="mt-4 space-y-3">
              {q.data.startDatetime && (
                <div className="flex items-start gap-3">
                  <CalendarDays
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Date &amp; Time
                    </dt>
                    <dd className="mt-0.5 text-sm text-slate-700">
                      {formatDateTime(q.data.startDatetime)}
                    </dd>
                  </div>
                </div>
              )}

              {q.data.providerName && (
                <div className="flex items-start gap-3">
                  <User
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Provider
                    </dt>
                    <dd className="mt-0.5 text-sm text-slate-700">
                      {q.data.providerName}
                    </dd>
                  </div>
                </div>
              )}

              {q.data.notes && (
                <div className="border-t border-slate-100 pt-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Notes
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {q.data.notes}
                  </dd>
                </div>
              )}

              {(q.data.servicePrice || q.data.latestPayment) && (
                <div className="border-t border-slate-100 pt-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Payment
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {q.data.servicePrice && (
                      <span>
                        Amount: {q.data.servicePrice}{' '}
                        {(q.data.serviceCurrency ?? '').toUpperCase()}
                      </span>
                    )}
                    {q.data.latestPayment && (
                      <span className="ml-2 text-slate-600">
                        Status: {q.data.latestPayment.status}
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {!editing ? (
            <div className="flex flex-wrap gap-3">
              {q.data.canPayWithStripe && (
                <Button
                  type="button"
                  disabled={checkout.isPending}
                  onClick={() => checkout.mutate()}
                >
                  {checkout.isPending ? 'Redirecting…' : 'Pay with Stripe'}
                </Button>
              )}
              {checkout.isError && (
                <p className="w-full text-sm text-red-600" role="alert">
                  {(checkout.error as Error).message}
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => openEdit(q.data)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Edit appointment
              </Button>
              <button
                type="button"
                disabled={cancel.isPending}
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this appointment?')) {
                    cancel.mutate();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {cancel.isPending ? 'Cancelling…' : 'Cancel appointment'}
              </button>
            </div>
          ) : (
            <Card>
              <h2 className="mb-4 text-base font-semibold text-slate-900">
                Edit Appointment
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <FormField label="Date & Time" htmlFor="edit-start">
                  <Input
                    id="edit-start"
                    type="datetime-local"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                  />
                </FormField>

                <FormField label="Notes" htmlFor="edit-notes">
                  <textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </FormField>

                {update.isError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
                    <p className="text-sm text-red-700" role="alert">
                      {(update.error as Error).message}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <Button type="submit" disabled={update.isPending}>
                    {update.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
