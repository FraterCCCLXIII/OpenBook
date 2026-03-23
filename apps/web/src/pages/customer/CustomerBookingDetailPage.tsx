import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

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
        if (!res.ok) {
          throw new Error('Could not cancel');
        }
        return res.json();
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'appointments'] });
      navigate('/customer/bookings');
    },
  });

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
          {q.data.providerName && <p className="text-sm text-zinc-500">With {q.data.providerName}</p>}
          {q.data.notes && <p className="text-sm text-zinc-400 whitespace-pre-wrap">{q.data.notes}</p>}
          <button
            type="button"
            className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-2 text-sm text-red-300 hover:bg-red-950/50"
            disabled={cancel.isPending}
            onClick={() => {
              if (confirm('Cancel this appointment?')) {
                cancel.mutate();
              }
            }}
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel appointment'}
          </button>
        </>
      )}
    </div>
  );
}
