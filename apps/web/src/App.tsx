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

export default function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">OpenBook</h1>
        <p className="text-sm text-zinc-400">Full-stack TypeScript scaffold (Vite + NestJS)</p>
      </header>
      <main className="px-6 py-8">
        <section className="max-w-lg rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
            API status
          </h2>
          {health.isPending && <p className="text-zinc-400">Checking…</p>}
          {health.isError && (
            <p className="text-red-400">
              {(health.error as Error).message}. Start the API:{' '}
              <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-200">pnpm --filter @openbook/api dev</code>
            </p>
          )}
          {health.isSuccess && (
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">status</dt>
                <dd className="font-mono text-emerald-400">{health.data.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">service</dt>
                <dd className="font-mono">{health.data.service}</dd>
              </div>
              {health.data.version !== undefined && (
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">version</dt>
                  <dd className="font-mono">{health.data.version}</dd>
                </div>
              )}
            </dl>
          )}
        </section>
      </main>
    </div>
  );
}
