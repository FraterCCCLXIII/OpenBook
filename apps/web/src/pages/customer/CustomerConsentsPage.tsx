import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type ConsentRow = {
  id: number;
  type: string;
  ip: string;
  createdAt: string | null;
};

async function fetchConsents(): Promise<{ items: ConsentRow[] }> {
  const res = await fetch('/api/customer/consents', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load consents');
  return res.json() as Promise<{ items: ConsentRow[] }>;
}

export function CustomerConsentsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['customer', 'consents'], queryFn: fetchConsents });

  const accept = useMutation({
    mutationFn: (type: string) =>
      fetch('/api/customer/consents', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      }).then((r) => r.json()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['customer', 'consents'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-50">Privacy &amp; Consents</h1>
      <p className="text-sm text-zinc-400">
        Record your acceptance of our terms and privacy policy below. Each consent is
        time-stamped and associated with your account.
      </p>

      <div className="flex flex-wrap gap-3">
        {['terms', 'privacy_policy', 'marketing'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => accept.mutate(t)}
            disabled={accept.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Accept {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {accept.isSuccess && (
        <p className="text-sm text-emerald-400">Consent recorded.</p>
      )}

      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}

      {q.isSuccess && q.data.items.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
          No consents recorded yet.
        </div>
      )}

      {q.isSuccess && q.data.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800/80">
                  <td className="px-3 py-2 font-mono text-xs">{c.type}</td>
                  <td className="px-3 py-2 text-zinc-500">{c.ip}</td>
                  <td className="px-3 py-2 text-zinc-500">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
