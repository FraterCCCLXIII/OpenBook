import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../../lib/api';

type Webhook = {
  id: number;
  name: string;
  url: string;
  actions: string | null;
  isActive: boolean;
  notes: string | null;
};

const AVAILABLE_ACTIONS = ['appointment.created', 'appointment.updated', 'appointment.deleted'];

export function StaffWebhooksPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [creating, setCreating] = useState(false);

  const q = useQuery({
    queryKey: ['staff', 'webhooks'],
    queryFn: () => apiJson<{ items: Webhook[] }>('/api/staff/webhooks'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      apiJson(`/api/staff/webhooks/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['staff', 'webhooks'] }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiJson(`/api/staff/webhooks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: isActive ? 1 : 0 }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['staff', 'webhooks'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-50">Webhooks</h1>
        <button
          type="button"
          onClick={() => { setCreating(true); setEditing(null); }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          New webhook
        </button>
      </div>

      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}

      {q.isSuccess && !creating && !editing && (
        <div className="space-y-2">
          {q.data.items.length === 0 && (
            <p className="text-sm text-zinc-500">No webhooks configured.</p>
          )}
          {q.data.items.map((wh) => (
            <div
              key={wh.id}
              className="flex items-start justify-between rounded-lg border border-zinc-800 p-4"
            >
              <div className="space-y-0.5">
                <p className="font-medium text-zinc-100">{wh.name}</p>
                <p className="text-xs text-zinc-500 break-all">{wh.url}</p>
                {wh.actions && (
                  <p className="text-xs text-zinc-600">Events: {wh.actions}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMut.mutate({ id: wh.id, isActive: !wh.isActive })}
                  className={`rounded px-2 py-1 text-xs ${wh.isActive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}
                >
                  {wh.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(wh)}
                  className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteMut.mutate(wh.id)}
                  className="rounded border border-red-900 px-2 py-1 text-xs text-red-400 hover:border-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <WebhookForm
          initial={editing}
          onSave={() => {
            void qc.invalidateQueries({ queryKey: ['staff', 'webhooks'] });
            setCreating(false);
            setEditing(null);
          }}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function WebhookForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Webhook | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [selectedActions, setSelectedActions] = useState<string[]>(
    initial?.actions ? initial.actions.split(',').map((s) => s.trim()).filter(Boolean) : [],
  );
  const [secretToken, setSecretToken] = useState('');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      initial
        ? apiJson(`/api/staff/webhooks/${initial.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : apiJson('/api/staff/webhooks', {
            method: 'POST',
            body: JSON.stringify(body),
          }),
    onSuccess: onSave,
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required');
      return;
    }
    setError(null);
    saveMut.mutate({
      name: name.trim(),
      url: url.trim(),
      actions: selectedActions.join(',') || undefined,
      notes: notes.trim() || undefined,
      ...(secretToken.trim() ? { secretToken: secretToken.trim() } : {}),
    });
  }

  function toggleAction(action: string) {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action],
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-lg font-medium text-zinc-100">
        {initial ? 'Edit webhook' : 'New webhook'}
      </h2>

      {[
        { label: 'Name *', value: name, setter: setName, placeholder: 'My webhook' },
        { label: 'URL *', value: url, setter: setUrl, placeholder: 'https://example.com/hook' },
        { label: 'Secret token', value: secretToken, setter: setSecretToken, placeholder: 'Optional HMAC secret' },
      ].map(({ label, value, setter, placeholder }) => (
        <label key={label} className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">{label}</span>
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setter(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
      ))}

      <div className="space-y-1">
        <span className="text-xs uppercase text-zinc-500">Events to fire on</span>
        <div className="space-y-1">
          {AVAILABLE_ACTIONS.map((action) => (
            <label key={action} className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={selectedActions.includes(action)}
                onChange={() => toggleAction(action)}
                className="accent-emerald-500"
              />
              {action}
            </label>
          ))}
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-xs uppercase text-zinc-500">Notes</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saveMut.isPending}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {saveMut.isPending ? 'Saving…' : 'Save webhook'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-700 px-5 py-2 text-sm text-zinc-300 hover:border-zinc-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
