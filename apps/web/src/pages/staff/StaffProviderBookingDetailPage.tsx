import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiJson } from '../../lib/api';

type Row = {
  id: string;
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
  serviceName: string | null;
  customerName: string | null;
};

export function StaffProviderBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['staff', 'provider-bookings', id],
    queryFn: () =>
      apiJson<Row>(`/api/staff/provider/bookings/${encodeURIComponent(id ?? '')}`),
    enabled: Boolean(id),
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link to="/staff/provider/bookings" className="text-sm text-emerald-500 hover:underline">
        ← Provider bookings
      </Link>
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <>
          <h1 className="text-2xl font-semibold text-zinc-50">{q.data.serviceName ?? 'Appointment'}</h1>
          {q.data.startDatetime && (
            <p className="text-zinc-400">{new Date(q.data.startDatetime).toLocaleString()}</p>
          )}
          {q.data.customerName && <p className="text-sm text-zinc-500">Customer: {q.data.customerName}</p>}
          {q.data.notes && <p className="text-sm text-zinc-400 whitespace-pre-wrap">{q.data.notes}</p>}
        </>
      )}
    </div>
  );
}
