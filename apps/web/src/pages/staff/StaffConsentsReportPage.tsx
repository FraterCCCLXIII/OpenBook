import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiJson } from '../../lib/api';

export function StaffConsentsReportPage() {
  const [typeFilter, setTypeFilter] = useState('');

  const q = useQuery({
    queryKey: ['staff', 'consents', typeFilter],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (typeFilter.trim()) qs.set('type', typeFilter.trim());
      qs.set('limit', '80');
      return apiJson<{
        total: number;
        items: Array<{
          id: number;
          type: string;
          ip: string;
          email: string | null;
          userId: string | null;
          userEmail: string | null;
          userDisplayName: string | null;
          createdAt: string | null;
        }>;
      }>(`/api/staff/consents?${qs.toString()}`);
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Consents</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Records from <code className="text-zinc-600">ea_consents</code> (customer portal + linked user when present).
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        Filter type
        <input
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="e.g. terms, privacy_policy"
          className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
        />
      </label>
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <p className="text-xs text-zinc-500">
          Total: {q.data.total}
        </p>
      )}
      {q.isSuccess && q.data.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-500">
              <tr>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">IP</th>
                <th className="px-2 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800/70">
                  <td className="px-2 py-2">{r.type}</td>
                  <td className="px-2 py-2">
                    {r.userDisplayName || r.userEmail || r.email || '—'}
                  </td>
                  <td className="px-2 py-2 font-mono text-zinc-500">{r.ip}</td>
                  <td className="px-2 py-2 text-zinc-500">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
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
