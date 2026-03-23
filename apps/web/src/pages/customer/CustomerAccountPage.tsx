import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { apiJson } from '../../lib/api';

export function CustomerAccountPage() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: () =>
      apiJson<{
        kind: string;
        customerId: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
      }>('/api/customer/profile'),
    enabled: user?.kind === 'customer',
  });

  const save = useMutation({
    mutationFn: (body: { first_name: string; last_name: string }) =>
      apiJson('/api/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'profile'] });
      void refresh();
    },
  });

  if (user?.kind !== 'customer') {
    return null;
  }

  const first = profile.data?.firstName ?? '';
  const last = profile.data?.lastName ?? '';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-50">My account</h1>
      <p className="text-zinc-400">
        Signed in as <span className="font-medium text-zinc-200">{user.email}</span>
      </p>

      {profile.isPending && <p className="text-sm text-zinc-500">Loading profile…</p>}
      {profile.isError && (
        <p className="text-sm text-red-400">{(profile.error as Error).message}</p>
      )}

      {profile.isSuccess && (
        <form
          className="max-w-md space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            save.mutate({
              first_name: String(fd.get('first_name') ?? ''),
              last_name: String(fd.get('last_name') ?? ''),
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">First name</span>
              <input
                name="first_name"
                defaultValue={first}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Last name</span>
              <input
                name="last_name"
                defaultValue={last}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save profile'}
          </button>
          {save.isSuccess && <p className="text-sm text-emerald-500">Saved.</p>}
        </form>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/customer/bookings"
          className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-emerald-400 hover:bg-zinc-800"
        >
          My bookings
        </Link>
        <Link
          to="/customer/forms"
          className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-emerald-400 hover:bg-zinc-800"
        >
          My forms
        </Link>
      </div>
    </div>
  );
}
