import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { apiJson } from '../../lib/api';

type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export function StaffCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['staff', 'customers', id],
    queryFn: () => apiJson<Customer>(`/api/staff/customers/${encodeURIComponent(id ?? '')}`),
    enabled: Boolean(id),
  });

  const save = useMutation({
    mutationFn: (body: { first_name: string; last_name: string; email: string }) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
    },
  });

  const deleteM = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      void navigate('/staff/customers');
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save.mutate({
              first_name: String(fd.get('first_name') ?? ''),
              last_name: String(fd.get('last_name') ?? ''),
              email: String(fd.get('email') ?? ''),
            });
          }}
        >
          <h1 className="text-2xl font-semibold text-zinc-50">
            {[q.data.firstName, q.data.lastName].filter(Boolean).join(' ') || 'Customer'}
          </h1>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">First name</span>
            <input
              name="first_name"
              defaultValue={q.data.firstName ?? ''}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Last name</span>
            <input
              name="last_name"
              defaultValue={q.data.lastName ?? ''}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={q.data.email ?? ''}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              disabled={deleteM.isPending}
              onClick={() => {
                if (confirm('Delete this customer?')) deleteM.mutate();
              }}
              className="rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 disabled:opacity-50"
            >
              {deleteM.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
