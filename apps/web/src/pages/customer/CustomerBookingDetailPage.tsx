import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiJson } from '../../lib/api';

type Appt = {
  id: string;
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
  serviceName: string | null;
  providerName: string | null;
};

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
        if (!res.ok) throw new Error('Could not cancel');
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
    <div className="mx-auto max-w-lg space-y-4">
      <Link to="/customer/bookings" className="text-sm text-emerald-500 hover:underline">
        ← Back to bookings
      </Link>
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <>
          <h1 className="text-2xl font-semibold text-zinc-50">{q.data.serviceName ?? 'Appointment'}</h1>
          {q.data.startDatetime && (
            <p className="text-zinc-400">{new Date(q.data.startDatetime).toLocaleString()}</p>
          )}
          {q.data.providerName && (
            <p className="text-sm text-zinc-500">With {q.data.providerName}</p>
          )}
          {q.data.notes && (
            <p className="text-sm text-zinc-400 whitespace-pre-wrap">{q.data.notes}</p>
          )}

          {!editing ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => openEdit(q.data)}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Edit appointment
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-2 text-sm text-red-300 hover:bg-red-950/50"
                disabled={cancel.isPending}
                onClick={() => {
                  if (confirm('Cancel this appointment?')) cancel.mutate();
                }}
              >
                {cancel.isPending ? 'Cancelling…' : 'Cancel appointment'}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleEditSubmit}
              className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-4"
            >
              <h2 className="text-sm font-semibold text-zinc-200">Edit Appointment</h2>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">Date &amp; Time</span>
                <input
                  type="datetime-local"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase text-zinc-500">Notes</span>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
                />
              </label>
              {update.isError && (
                <p className="text-sm text-red-400">{(update.error as Error).message}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={update.isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {update.isPending ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
