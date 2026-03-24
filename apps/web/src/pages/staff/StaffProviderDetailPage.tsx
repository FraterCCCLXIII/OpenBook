import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiJson } from '../../lib/api';

type ProviderDetail = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  timezone: string | null;
  workingPlan: string | null;
  googleSync: boolean;
  googleCalendar: string | null;
  syncPastDays: number;
  syncFutureDays: number;
  serviceIds: string[];
};

type ServiceOption = { id: string; name: string | null };

export function StaffProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['staff', 'providers', id],
    queryFn: () => apiJson<ProviderDetail>(`/api/staff/providers/${encodeURIComponent(id ?? '')}`),
    enabled: Boolean(id),
  });

  const services = useQuery({
    queryKey: ['staff', 'services'],
    queryFn: () =>
      apiJson<{ items: ServiceOption[] }>('/api/staff/services').then((r) => r.items),
  });

  const [workingPlan, setWorkingPlan] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[] | null>(null);

  const effectivePlan = workingPlan ?? q.data?.workingPlan ?? '{}';
  const effectiveTimezone = timezone ?? q.data?.timezone ?? '';
  const effectiveServices = selectedServices ?? q.data?.serviceIds ?? [];

  const m = useMutation({
    mutationFn: (body: { working_plan?: string; timezone?: string; services?: string[] }) =>
      apiJson<ProviderDetail>(`/api/staff/providers/${encodeURIComponent(id ?? '')}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void qc.setQueryData(['staff', 'providers', id], data);
      void qc.invalidateQueries({ queryKey: ['staff', 'team', 'provider'] });
      setWorkingPlan(null);
      setTimezone(null);
      setSelectedServices(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/team/provider/${encodeURIComponent(id ?? '')}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'team', 'provider'] });
      navigate('/staff/providers');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    m.mutate({
      working_plan: effectivePlan,
      timezone: effectiveTimezone,
      services: effectiveServices,
    });
  }

  function toggleService(sid: string) {
    const current = effectiveServices;
    setSelectedServices(
      current.includes(sid) ? current.filter((s) => s !== sid) : [...current, sid],
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-50">
        {q.data ? [q.data.firstName, q.data.lastName].filter(Boolean).join(' ') || 'Provider' : '…'}
      </h1>

      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}

      {q.isSuccess && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
            <p><span className="text-zinc-500">Email:</span> {q.data.email ?? '—'}</p>
            {q.data.googleSync && (
              <p className="mt-1 text-emerald-500">Google Calendar connected{q.data.googleCalendar ? ` (${q.data.googleCalendar})` : ''}</p>
            )}
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-500">Timezone</span>
            <input
              type="text"
              value={effectiveTimezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York"
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-500">Working plan (JSON)</span>
            <textarea
              rows={10}
              value={effectivePlan}
              onChange={(e) => setWorkingPlan(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase text-zinc-500">Service assignments</span>
            {services.isPending && <p className="text-xs text-zinc-500">Loading services…</p>}
            {services.isSuccess && (
              <div className="grid grid-cols-2 gap-2">
                {services.data.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={effectiveServices.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                      className="accent-emerald-500"
                    />
                    {s.name ?? s.id}
                  </label>
                ))}
              </div>
            )}
          </div>

          {m.isError && (
            <p className="text-sm text-red-400">{(m.error as Error).message}</p>
          )}
          {m.isSuccess && (
            <p className="text-sm text-emerald-500">Saved successfully.</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={m.isPending}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {m.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (window.confirm('Delete this provider? This cannot be undone.')) {
                  deleteMut.mutate();
                }
              }}
              className="rounded-lg border border-red-900 px-6 py-2 text-sm text-red-400 hover:border-red-700 disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete provider'}
            </button>
          </div>
          {deleteMut.isError && (
            <p className="text-sm text-red-400">{(deleteMut.error as Error).message}</p>
          )}
        </form>
      )}
    </div>
  );
}
