import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiJson } from '../../lib/api';

export function StaffToolsPage() {
  const [country, setCountry] = useState('US');
  const [q, setQ] = useState('');

  const postal = useQuery({
    queryKey: ['staff', 'tools', 'postal', country, q],
    queryFn: () =>
      apiJson<{
        items: Array<{
          id: string;
          postalCode: string;
          countryCode: string;
          placeName: string | null;
          adminName1: string | null;
        }>;
        message?: string;
      }>(
        `/api/staff/tools/postal-lookup?country=${encodeURIComponent(country)}&q=${encodeURIComponent(q)}`,
      ),
    enabled: q.trim().length >= 2,
  });

  const queueGeo = useMutation({
    mutationFn: () =>
      apiJson('/api/staff/system/geonames-import', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Tools</h1>
        <p className="mt-1 text-sm text-zinc-500">
          GeoNames postal lookup uses <code className="text-zinc-600">ea_geonames_postal_codes</code>. Import
          data via your DBA or queue a background stub job (Redis + worker).
        </p>
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Postal code lookup</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="text-xs text-zinc-500">
            Country
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              className="ml-2 w-16 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Search
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ZIP or place"
              className="ml-2 min-w-[200px] rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
            />
          </label>
        </div>
        {postal.isPending && q.length >= 2 && (
          <p className="mt-2 text-xs text-zinc-500">Searching…</p>
        )}
        {postal.isError && (
          <p className="mt-2 text-xs text-red-400">{(postal.error as Error).message}</p>
        )}
        {postal.data?.message && <p className="mt-2 text-xs text-amber-400">{postal.data.message}</p>}
        {postal.isSuccess && postal.data.items.length > 0 && (
          <div className="mt-3 max-h-64 overflow-auto rounded border border-zinc-800">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-500">
                <tr>
                  <th className="px-2 py-1">Postal</th>
                  <th className="px-2 py-1">Place</th>
                  <th className="px-2 py-1">Region</th>
                </tr>
              </thead>
              <tbody>
                {postal.data.items.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-800/60">
                    <td className="px-2 py-1 font-mono">{r.postalCode}</td>
                    <td className="px-2 py-1">{r.placeName ?? '—'}</td>
                    <td className="px-2 py-1">{r.adminName1 ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {postal.isSuccess && q.length >= 2 && postal.data.items.length === 0 && !postal.data.message && (
          <p className="mt-2 text-xs text-zinc-500">No rows (table may be empty).</p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">GeoNames import job</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Queues a worker job (audit log only until CSV import is wired). Requires <code className="text-zinc-600">REDIS_URL</code> and{' '}
          <code className="text-zinc-600">pnpm --filter @openbook/api run worker</code>.
        </p>
        <button
          type="button"
          disabled={queueGeo.isPending}
          onClick={() => queueGeo.mutate()}
          className="mt-3 rounded border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          {queueGeo.isPending ? 'Queueing…' : 'Queue GeoNames import stub'}
        </button>
        {queueGeo.isSuccess && <p className="mt-2 text-xs text-emerald-500">Queued.</p>}
        {queueGeo.isError && (
          <p className="mt-2 text-xs text-red-400">{(queueGeo.error as Error).message}</p>
        )}
      </section>
    </div>
  );
}
