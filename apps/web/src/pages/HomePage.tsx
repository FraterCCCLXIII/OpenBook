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

export function HomePage() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Schedule appointments</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          This is the new React app. Booking, customer accounts, and staff tools will call the Nest API as we port
          features from the PHP installation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/book"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Book an appointment
          </Link>
          <Link
            to="/customer/login"
            className="inline-flex items-center rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Customer sign in
          </Link>
          <Link
            to="/staff/login"
            className="inline-flex items-center rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Staff sign in
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">API status</h2>
        {health.isPending && <p className="mt-2 text-sm text-zinc-400">Checking backend…</p>}
        {health.isError && (
          <p className="mt-2 text-sm text-red-400">
            {(health.error as Error).message}. Run{' '}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">pnpm --filter @openbook/api dev</code>
          </p>
        )}
        {health.isSuccess && (
          <dl className="mt-3 grid max-w-md gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">status</dt>
              <dd className="font-mono text-emerald-400">{health.data.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">service</dt>
              <dd className="font-mono">{health.data.service}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
}
