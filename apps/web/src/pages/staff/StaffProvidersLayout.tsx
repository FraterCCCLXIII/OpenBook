import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom';
import { StaffMasterDetailLayout } from '../../components/staff/StaffMasterDetailLayout';
import {
  StaffRecordListPanel,
  StaffRecordPlaceholder,
} from '../../components/staff/StaffRecordListPanel';
import { apiJson } from '../../lib/api';

type TeamRow = { id: string; displayName: string; email: string | null };

function filterTeam(items: TeamRow[], q: string): TeamRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (u) =>
      u.displayName.toLowerCase().includes(s) ||
      (u.email ?? '').toLowerCase().includes(s),
  );
}

export function StaffProvidersLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const match = useMatch('/staff/providers/:id');
  const selectedId = match?.params.id;

  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const q = useQuery({
    queryKey: ['staff', 'team', 'provider'],
    queryFn: () =>
      apiJson<{ items: TeamRow[] }>('/api/staff/team/provider'),
  });

  const createMut = useMutation({
    mutationFn: (body: {
      firstName: string;
      lastName: string;
      email: string;
      username: string;
      password: string;
    }) =>
      apiJson<{ id: string }>('/api/staff/team/provider', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['staff', 'team', 'provider'] });
      setShowCreate(false);
      navigate(`/staff/providers/${data.id}`);
    },
  });

  const filtered = useMemo(
    () => (q.isSuccess ? filterTeam(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  return (
    <>
    <StaffMasterDetailLayout
      panel={
        <StaffRecordListPanel
          id="filter-providers"
          title="Providers"
          searchValue={filter}
          onSearchChange={setFilter}
          headerExtra={
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="rounded-lg border border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-950/50"
            >
              + Add
            </button>
          }
        >
          {q.isPending && (
            <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>
          )}
          {q.isError && (
            <p className="px-4 py-6 text-sm text-red-400">
              {(q.error as Error).message}
            </p>
          )}
          {q.isSuccess && filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-zinc-500">No matching providers.</p>
          )}
          {q.isSuccess && filtered.length > 0 && (
            <ul className="divide-y divide-zinc-800">
              {filtered.map((u) => {
                const isSelected = selectedId === u.id;
                return (
                  <li key={u.id}>
                    <Link
                      to={`/staff/providers/${u.id}`}
                      className={[
                        'block px-3.5 py-3.5 text-left transition-colors',
                        isSelected
                          ? 'border-l-[3px] border-emerald-500 bg-zinc-800/90 pl-[calc(0.875rem-3px)]'
                          : 'hover:bg-zinc-900/80',
                      ].join(' ')}
                      aria-current={isSelected ? 'page' : undefined}
                    >
                      <strong className="block text-sm font-semibold text-zinc-100">
                        {u.displayName}
                      </strong>
                      {u.email && (
                        <span className="mt-1 block text-xs leading-snug text-zinc-500">
                          {u.email}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </StaffRecordListPanel>
      }
      detail={
        selectedId ? (
          <Outlet />
        ) : (
          <StaffRecordPlaceholder message="Select a provider from the list." />
        )
      }
    />
    {showCreate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">New provider</h3>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMut.mutate({
                firstName: String(fd.get('first_name') ?? ''),
                lastName: String(fd.get('last_name') ?? ''),
                email: String(fd.get('email') ?? ''),
                username: String(fd.get('username') ?? ''),
                password: String(fd.get('password') ?? ''),
              });
            }}
          >
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">First name</span>
              <input name="first_name" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Last name</span>
              <input name="last_name" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Email *</span>
              <input name="email" type="email" required className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Username *</span>
              <input name="username" required autoComplete="username" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Password *</span>
              <input name="password" type="password" required autoComplete="new-password" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            {createMut.isError && (
              <p className="text-xs text-red-400">{(createMut.error as Error).message}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={createMut.isPending}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {createMut.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
