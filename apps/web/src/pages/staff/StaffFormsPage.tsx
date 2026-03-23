import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../../lib/api';

type FormField = {
  id?: number;
  label: string;
  fieldType: string;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
};

type FormListItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  fieldCount: number;
};

type FormDetail = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  fields: FormField[];
  roleAssignments: string[];
};

const FIELD_TYPES = ['input', 'text', 'dropdown', 'radio', 'checkboxes', 'date'] as const;

function emptyField(idx: number): FormField {
  return { label: '', fieldType: 'input', options: [], isRequired: false, sortOrder: idx };
}

export function StaffFormsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const listQ = useQuery({
    queryKey: ['staff', 'forms'],
    queryFn: () => apiJson<{ items: FormListItem[] }>('/api/staff/forms'),
  });

  const detailQ = useQuery({
    queryKey: ['staff', 'forms', selected],
    queryFn: () => apiJson<FormDetail>(`/api/staff/forms/${selected}`),
    enabled: selected !== null,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiJson(`/api/staff/forms/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'forms'] });
      setSelected(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-50">Forms</h1>
        <button
          type="button"
          onClick={() => { setCreating(true); setSelected(null); }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          New form
        </button>
      </div>

      {listQ.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {listQ.isError && <p className="text-sm text-red-400">{(listQ.error as Error).message}</p>}

      {listQ.isSuccess && !creating && selected === null && (
        <div className="space-y-2">
          {listQ.data.items.length === 0 && (
            <p className="text-sm text-zinc-500">No forms yet. Create one to get started.</p>
          )}
          {listQ.data.items.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3"
            >
              <div>
                <p className="font-medium text-zinc-100">{f.name}</p>
                <p className="text-xs text-zinc-500">
                  {f.fieldCount} field{f.fieldCount !== 1 ? 's' : ''} · slug: {f.slug}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(f.id)}
                  className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(f.id)}
                  className="rounded border border-red-900 px-3 py-1 text-xs text-red-400 hover:border-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <FormEditor
          initial={null}
          onSave={() => {
            void qc.invalidateQueries({ queryKey: ['staff', 'forms'] });
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {selected !== null && detailQ.isSuccess && (
        <FormEditor
          initial={detailQ.data}
          onSave={() => {
            void qc.invalidateQueries({ queryKey: ['staff', 'forms'] });
            void qc.invalidateQueries({ queryKey: ['staff', 'forms', selected] });
            setSelected(null);
          }}
          onCancel={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function FormEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: FormDetail | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [fields, setFields] = useState<FormField[]>(
    initial?.fields ?? [emptyField(0)],
  );
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (body: { name: string; description: string; fields: FormField[] }) =>
      initial
        ? apiJson(`/api/staff/forms/${initial.id}`, {
            method: 'PUT',
            body: JSON.stringify(body),
          })
        : apiJson('/api/staff/forms', {
            method: 'POST',
            body: JSON.stringify(body),
          }),
    onSuccess: onSave,
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  function addField() {
    setFields((f) => [...f, emptyField(f.length)]);
  }

  function removeField(idx: number) {
    setFields((f) => f.filter((_, i) => i !== idx));
  }

  function updateField(idx: number, patch: Partial<FormField>) {
    setFields((f) => f.map((field, i) => (i === idx ? { ...field, ...patch } : field)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setError(null);
    saveMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      fields: fields.map((f, idx) => ({ ...f, sortOrder: idx })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-lg font-medium text-zinc-100">
        {initial ? 'Edit form' : 'New form'}
      </h2>

      <label className="block space-y-1">
        <span className="text-xs uppercase text-zinc-500">Form name *</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
          placeholder="e.g. New patient intake"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs uppercase text-zinc-500">Description</span>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-zinc-500">Fields</span>
          <button
            type="button"
            onClick={addField}
            className="text-xs text-emerald-500 hover:underline"
          >
            + Add field
          </button>
        </div>

        {fields.map((field, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-2 rounded border border-zinc-800 p-3"
          >
            <input
              type="text"
              placeholder="Field label"
              required
              value={field.label}
              onChange={(e) => updateField(idx, { label: e.target.value })}
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            />
            <select
              value={field.fieldType}
              onChange={(e) => updateField(idx, { fieldType: e.target.value })}
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={field.isRequired}
                onChange={(e) => updateField(idx, { isRequired: e.target.checked })}
                className="accent-emerald-500"
              />
              Required
            </label>
            <button
              type="button"
              onClick={() => removeField(idx)}
              className="text-xs text-red-500 hover:text-red-400"
            >
              ✕
            </button>

            {['dropdown', 'radio', 'checkboxes'].includes(field.fieldType) && (
              <div className="col-span-4 mt-1">
                <textarea
                  rows={2}
                  placeholder="Options — one per line"
                  value={field.options.join('\n')}
                  onChange={(e) =>
                    updateField(idx, {
                      options: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save form'}
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
