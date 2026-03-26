import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { apiForm, apiJson } from '../../lib/api';

export function StaffToolsPage() {
  const [country, setCountry] = useState('US');
  const [q, setQ] = useState('');
  const [truncate, setTruncate] = useState(false);
  const [importCountry, setImportCountry] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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
    mutationFn: async () => {
      const input = fileRef.current?.files?.[0];
      if (!input) {
        throw new Error('Choose a GeoNames postal codes file (.txt, tab-separated).');
      }
      const fd = new FormData();
      fd.append('file', input);
      if (truncate) fd.append('truncate', 'true');
      const cc = importCountry.trim().toUpperCase().slice(0, 2);
      if (cc) fd.append('countryCode', cc);
      return apiForm<{ ok: boolean; queued: boolean }>(
        '/api/staff/system/geonames-import',
        fd,
      );
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">GeoNames</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Postal code lookup uses <code className="text-zinc-600">ea_geonames_postal_codes</code>. Upload a
          GeoNames <code className="text-zinc-600">allCountries.zip</code> postal file (tab-separated) to import via
          the worker.
        </p>
      </div>

      <div className="flex gap-3 rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" clipRule="evenodd" />
        </svg>
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-300">Not fully connected</p>
          <p className="text-xs text-amber-400/80">
            GeoNames data is imported and queryable, but is not yet wired to any live feature — ZIP autofill
            during booking, geographic provider filtering, and service-area radius matching are all planned but
            not yet built. The import tool below populates the database for future use.
          </p>
        </div>
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
        <h2 className="text-sm font-semibold text-zinc-200">GeoNames import</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Upload a tab-separated postal-code file (GeoNames format). Requires <code className="text-zinc-600">REDIS_URL</code> and{' '}
          <code className="text-zinc-600">pnpm --filter @openbook/api run worker</code>. Use <strong>Truncate</strong> to
          wipe the table first, or set <strong>Country</strong> to replace one country without truncating the rest.
        </p>
        <div className="mt-3 flex flex-col gap-3 text-xs text-zinc-400">
          <label className="block">
            <span className="text-zinc-500">Postal file</span>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              className="mt-1 block w-full max-w-md text-sm text-zinc-300 file:mr-2 file:rounded file:border file:border-zinc-600 file:bg-zinc-800 file:px-2 file:py-1"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={truncate}
              onChange={(e) => setTruncate(e.target.checked)}
            />
            Truncate all GeoNames rows before import
          </label>
          <label className="block max-w-xs">
            Country (optional, 2-letter — replace only this country)
            <input
              value={importCountry}
              onChange={(e) => setImportCountry(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="US"
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
            />
          </label>
          <button
            type="button"
            disabled={queueGeo.isPending}
            onClick={() => queueGeo.mutate()}
            className="w-fit rounded border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {queueGeo.isPending ? 'Queueing…' : 'Upload & queue import'}
          </button>
          {queueGeo.isSuccess && <p className="text-xs text-emerald-500">Queued for worker.</p>}
          {queueGeo.isError && (
            <p className="text-xs text-red-400">{(queueGeo.error as Error).message}</p>
          )}
        </div>
      </section>
    </div>
  );
}
