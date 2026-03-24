import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiJson } from '../../lib/api';

type LdapRow = {
  dn: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export function StaffLdapImportPanel() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const search = useQuery({
    queryKey: ['staff', 'ldap', 'search', q],
    queryFn: () =>
      apiJson<{ items: LdapRow[] }>(
        `/api/staff/ldap/search?q=${encodeURIComponent(q.trim())}`,
      ),
    enabled: open && q.trim().length >= 2,
  });

  const importMut = useMutation({
    mutationFn: (entries: LdapRow[]) =>
      apiJson<{ ok: boolean; created: number; skipped: number }>(
        '/api/staff/ldap/import',
        {
          method: 'POST',
          body: JSON.stringify({
            entries: entries.map((e) => ({
              email: e.email,
              firstName: e.firstName,
              lastName: e.lastName,
            })),
          }),
        },
      ),
    onSuccess: () => {
      setSelected(new Set());
      void search.refetch();
    },
  });

  const rows = search.data?.items ?? [];
  const toggle = (email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const selectedRows = rows.filter((r) => selected.has(r.email));

  return (
    <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Import customers from LDAP</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Search the directory (requires LDAP active + bind credentials). Imported accounts have no password; customers use OTP / set-password flows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
        >
          {open ? 'Hide' : 'Open directory search'}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <label className="block text-xs text-zinc-500">
            Search (min 2 characters)
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="name or email fragment"
              className="mt-1 w-full max-w-md rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>

          {search.isPending && q.trim().length >= 2 && (
            <p className="text-xs text-zinc-500">Searching…</p>
          )}
          {search.isError && (
            <p className="text-xs text-red-400">{(search.error as Error).message}</p>
          )}

          {search.isSuccess && rows.length > 0 && (
            <div className="max-h-64 overflow-auto rounded border border-zinc-800">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-500">
                  <tr>
                    <th className="px-2 py-1" aria-label="Select" />
                    <th className="px-2 py-1">Email</th>
                    <th className="px-2 py-1">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.dn} className="border-b border-zinc-800/60">
                      <td className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selected.has(r.email)}
                          onChange={() => toggle(r.email)}
                          aria-label={`Select ${r.email}`}
                        />
                      </td>
                      <td className="px-2 py-1 font-mono">{r.email}</td>
                      <td className="px-2 py-1">
                        {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {search.isSuccess && q.trim().length >= 2 && rows.length === 0 && (
            <p className="text-xs text-zinc-500">No directory entries.</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={importMut.isPending || selectedRows.length === 0}
              onClick={() => importMut.mutate(selectedRows)}
              className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {importMut.isPending ? 'Importing…' : `Import selected (${selectedRows.length})`}
            </button>
            {importMut.isSuccess && (
              <span className="text-xs text-emerald-500">
                Created {importMut.data.created}, skipped {importMut.data.skipped} (duplicates).
              </span>
            )}
            {importMut.isError && (
              <span className="text-xs text-red-400">{(importMut.error as Error).message}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
