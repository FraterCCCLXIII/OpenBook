import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { healthResponseSchema } from '@openbook/shared';

async function fetchHealth() {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  const data: unknown = await res.json();
  return healthResponseSchema.parse(data);
}

async function fetchPublicSettings() {
  const res = await fetch('/api/settings/public');
  if (!res.ok) {
    throw new Error(`Public settings failed: ${res.status}`);
  }
  return res.json() as Promise<Record<string, string>>;
}

export function HomePage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  const publicSettings = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
  });

  const companyName = publicSettings.data?.company_name?.trim();

  return (
    <div className="space-y-8">
      {/* Hero card */}
      <section className="rounded-card bg-surface-card p-8 shadow-card md:p-12">
        <h1 className="font-brand text-3xl font-semibold text-slate-900">
          {companyName || 'Book an appointment'}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          {companyName
            ? 'Book online or sign in to manage your appointments.'
            : 'Schedule your appointment quickly and easily. Choose a service, pick a time, and you\u2019re all set.'}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/book"
            className="inline-flex items-center rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Book an appointment
          </Link>
          <Link
            to="/customer/login"
            className="inline-flex items-center rounded-lg border border-brand px-6 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
          >
            Sign in to my account
          </Link>
        </div>
      </section>

      {/* API status — development only */}
      {import.meta.env.DEV && (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            API status (dev only)
          </h2>
          {health.isPending && (
            <p className="mt-2 text-sm text-slate-500">Checking backend…</p>
          )}
          {health.isError && (
            <p className="mt-2 text-sm text-red-500">
              {(health.error as Error).message}. Run{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                pnpm --filter @openbook/api dev
              </code>
            </p>
          )}
          {health.isSuccess && (
            <dl className="mt-3 grid max-w-md gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">status</dt>
                <dd className="font-mono text-brand">{health.data.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">service</dt>
                <dd className="font-mono text-slate-700">{health.data.service}</dd>
              </div>
            </dl>
          )}
        </section>
      )}
    </div>
  );
}
