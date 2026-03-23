import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, Outlet, useMatch } from 'react-router-dom';
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
  const match = useMatch('/staff/providers/:id');
  const selectedId = match?.params.id;

  const [filter, setFilter] = useState('');

  const q = useQuery({
    queryKey: ['staff', 'team', 'provider'],
    queryFn: () =>
      apiJson<{ items: TeamRow[] }>('/api/staff/team/provider'),
  });

  const filtered = useMemo(
    () => (q.isSuccess ? filterTeam(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  return (
    <StaffMasterDetailLayout
      panel={
        <StaffRecordListPanel
          id="filter-providers"
          title="Providers"
          searchValue={filter}
          onSearchChange={setFilter}
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
  );
}
