import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, FileText, User } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { apiJson } from '../../lib/api';
import { Button, Card, FormField, Input } from '../../components/ui';

type CustomerProfile = {
  kind: string;
  customerId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export function CustomerAccountPage() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: () => apiJson<CustomerProfile>('/api/customer/profile'),
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
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as{' '}
          <span className="font-medium text-slate-700">{user.email}</span>
        </p>
      </div>

      {profile.isPending && (
        <p className="text-sm text-slate-400">Loading profile…</p>
      )}
      {profile.isError && (
        <p className="text-sm text-red-600">{(profile.error as Error).message}</p>
      )}

      {profile.isSuccess && (
        <Card>
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Profile
          </h2>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              save.mutate({
                first_name: String(fd.get('first_name') ?? ''),
                last_name: String(fd.get('last_name') ?? ''),
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First name" htmlFor="first_name">
                <Input
                  id="first_name"
                  name="first_name"
                  defaultValue={first}
                  placeholder="Jane"
                  autoComplete="given-name"
                />
              </FormField>
              <FormField label="Last name" htmlFor="last_name">
                <Input
                  id="last_name"
                  name="last_name"
                  defaultValue={last}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </FormField>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              {save.isSuccess && (
                <p className="text-sm text-brand">Saved successfully.</p>
              )}
              {save.isError && (
                <p className="text-sm text-red-600">
                  {(save.error as Error).message}
                </p>
              )}
            </div>
          </form>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quick links
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/customer/bookings"
            className="flex items-center gap-3 rounded-card border border-slate-200 bg-surface-card p-4 shadow-card transition-colors hover:border-brand hover:shadow-md"
          >
            <CalendarDays className="h-5 w-5 text-brand" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">
              My bookings
            </span>
          </Link>
          <Link
            to="/customer/forms"
            className="flex items-center gap-3 rounded-card border border-slate-200 bg-surface-card p-4 shadow-card transition-colors hover:border-brand hover:shadow-md"
          >
            <FileText className="h-5 w-5 text-brand" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">My forms</span>
          </Link>
          <Link
            to="/customer/consents"
            className="flex items-center gap-3 rounded-card border border-slate-200 bg-surface-card p-4 shadow-card transition-colors hover:border-brand hover:shadow-md"
          >
            <User className="h-5 w-5 text-brand" aria-hidden="true" />
            <span className="text-sm font-medium text-slate-700">
              Privacy &amp; consents
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
