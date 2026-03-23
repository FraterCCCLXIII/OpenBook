import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom';
import { StaffMasterDetailLayout } from '../../components/staff/StaffMasterDetailLayout';
import {
  StaffRecordListPanel,
  StaffRecordPlaceholder,
} from '../../components/staff/StaffRecordListPanel';
import { apiJson } from '../../lib/api';

type CustomerRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

function filterCustomers(items: CustomerRow[], q: string): CustomerRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter((c) => {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ').toLowerCase();
    const email = (c.email ?? '').toLowerCase();
    return name.includes(s) || email.includes(s);
  });
}

export function StaffCustomersLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const match = useMatch('/staff/customers/:id');
  const selectedId = match?.params.id;

  const [filter, setFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const q = useQuery({
    queryKey: ['staff', 'customers'],
    queryFn: () =>
      apiJson<{ items: CustomerRow[] }>('/api/staff/customers'),
  });

  const createM = useMutation({
    mutationFn: (body: { first_name: string; last_name: string; email: string }) =>
      apiJson<CustomerRow>('/api/staff/customers', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      setShowNew(false);
      setNewFirst('');
      setNewLast('');
      setNewEmail('');
      void navigate(`/staff/customers/${data.id}`);
    },
  });

  const filtered = useMemo(
    () => (q.isSuccess ? filterCustomers(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  return (
    <StaffMasterDetailLayout
      panel={
        <StaffRecordListPanel
          id="filter-customers"
          title="Customers"
          searchValue={filter}
          onSearchChange={setFilter}
          addButton={{
            label: 'Add',
            onClick: () => setShowNew((v) => !v),
          }}
          headerExtra={
            showNew ? (
              <form
                className="space-y-2 border-b border-zinc-800 px-4 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  createM.mutate({
                    first_name: newFirst,
                    last_name: newLast,
                    email: newEmail,
                  });
                }}
              >
                <div className="flex flex-wrap gap-2">
                  <input
                    value={newFirst}
                    onChange={(e) => setNewFirst(e.target.value)}
                    placeholder="First name"
                    className="min-w-[100px] flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  />
                  <input
                    value={newLast}
                    onChange={(e) => setNewLast(e.target.value)}
                    placeholder="Last name"
                    className="min-w-[100px] flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  />
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email *"
                    required
                    type="email"
                    className="min-w-[160px] flex-[2] rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createM.isPending}
                    className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {createM.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNew(false)}
                    className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
                {createM.isError && (
                  <p className="text-xs text-red-400">{(createM.error as Error).message}</p>
                )}
              </form>
            ) : null
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
            <p className="px-4 py-6 text-sm text-zinc-500">No matching customers.</p>
          )}
          {q.isSuccess && filtered.length > 0 && (
            <ul className="divide-y divide-zinc-800">
              {filtered.map((c) => {
                const name =
                  [c.firstName, c.lastName].filter(Boolean).join(' ') || '[No name]';
                const sub = [c.email].filter(Boolean).join(', ');
                const isSelected = selectedId === c.id;
                return (
                  <li key={c.id}>
                    <Link
                      to={`/staff/customers/${c.id}`}
                      className={[
                        'block px-3.5 py-3.5 text-left transition-colors',
                        isSelected
                          ? 'border-l-[3px] border-emerald-500 bg-zinc-800/90 pl-[calc(0.875rem-3px)]'
                          : 'hover:bg-zinc-900/80',
                      ].join(' ')}
                      aria-current={isSelected ? 'page' : undefined}
                    >
                      <strong className="block text-sm font-semibold text-zinc-100">
                        {name}
                      </strong>
                      {sub && (
                        <span className="mt-1 block text-xs leading-snug text-zinc-500">
                          {sub}
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
          <StaffRecordPlaceholder message="Select a customer from the list." />
        )
      }
    />
  );
}
