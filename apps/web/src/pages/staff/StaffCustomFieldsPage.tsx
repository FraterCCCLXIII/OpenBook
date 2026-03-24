import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../../lib/api';

type CustomFieldRow = {
  id: number;
  name: string;
  fieldType: string;
  defaultValue: string | null;
  isRequired: number;
  isDisplayed: number;
  isActive: number;
  sortOrder: number;
};

const FIELD_TYPES = ['input', 'text', 'textarea'] as const;

export function StaffCustomFieldsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const listQ = useQuery({
    queryKey: ['staff', 'custom-fields'],
    queryFn: () =>
      apiJson<{ items: CustomFieldRow[] }>('/api/staff/custom-fields'),
  });

  const selectedRow =
    selected != null && listQ.data
      ? listQ.data.items.find((x) => x.id === selected)
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Custom fields</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Global customer fields (stored in <code className="text-zinc-600">ea_custom_fields</code>
          ). Shown on the public booking form when active and displayed; values are saved on the
          customer record.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setSelected(null);
          }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          New field
        </button>
      </div>

      {listQ.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {listQ.isError && (
        <p className="text-sm text-red-400">{(listQ.error as Error).message}</p>
      )}

      {listQ.isSuccess && !creating && selected === null && (
        <div className="space-y-2">
          {listQ.data.items.length === 0 && (
            <p className="text-sm text-zinc-500">No custom fields yet.</p>
          )}
          {listQ.data.items.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 px-4 py-3"
            >
              <div>
                <p className="font-medium text-zinc-100">{f.name}</p>
                <p className="text-xs text-zinc-500">
                  {f.fieldType}
                  {' · '}
                  sort {f.sortOrder}
                  {' · '}
                  {f.isActive === 1 ? 'active' : 'inactive'}
                  {' · '}
                  {f.isDisplayed === 1 ? 'displayed' : 'hidden'}
                  {' · '}
                  {f.isRequired === 1 ? 'required' : 'optional'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(f.id);
                    setCreating(false);
                  }}
                  className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                >
                  Edit
                </button>
                <DeleteButton
                  id={f.id}
                  onDone={() => void qc.invalidateQueries({ queryKey: ['staff', 'custom-fields'] })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <FieldEditor
          initial={null}
          onSave={() => {
            void qc.invalidateQueries({ queryKey: ['staff', 'custom-fields'] });
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {selectedRow !== undefined && (
        <FieldEditor
          initial={selectedRow}
          onSave={() => {
            void qc.invalidateQueries({ queryKey: ['staff', 'custom-fields'] });
            setSelected(null);
          }}
          onCancel={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function DeleteButton({ id, onDone }: { id: number; onDone: () => void }) {
  const del = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/custom-fields/${id}`, { method: 'DELETE' }),
    onSuccess: onDone,
  });
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm('Delete this custom field? Values on customers may become orphaned.')) {
          del.mutate();
        }
      }}
      className="rounded border border-red-900 px-3 py-1 text-xs text-red-400 hover:border-red-700"
    >
      Delete
    </button>
  );
}

function FieldEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: CustomFieldRow | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [fieldType, setFieldType] = useState(
    initial?.fieldType && FIELD_TYPES.includes(initial.fieldType as (typeof FIELD_TYPES)[number])
      ? initial.fieldType
      : 'input',
  );
  const [defaultValue, setDefaultValue] = useState(initial?.defaultValue ?? '');
  const [isRequired, setIsRequired] = useState(initial?.isRequired === 1);
  const [isDisplayed, setIsDisplayed] = useState(initial?.isDisplayed !== 0);
  const [isActive, setIsActive] = useState(initial?.isActive !== 0);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        field_type: fieldType,
        default_value: defaultValue.trim() || null,
        is_required: isRequired ? 1 : 0,
        is_displayed: isDisplayed ? 1 : 0,
        is_active: isActive ? 1 : 0,
        sort_order: sortOrder,
      };
      return initial
        ? apiJson(`/api/staff/custom-fields/${initial.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : apiJson('/api/staff/custom-fields', {
            method: 'POST',
            body: JSON.stringify(body),
          });
    },
    onSuccess: onSave,
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError(null);
    saveMutation.mutate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-zinc-800 p-6"
    >
      <h2 className="text-lg font-medium text-zinc-100">
        {initial ? 'Edit custom field' : 'New custom field'}
      </h2>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div>
        <label htmlFor="cf-name" className="mb-1 block text-sm text-zinc-400">
          Label
        </label>
        <input
          id="cf-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          maxLength={256}
          required
        />
      </div>

      <div>
        <label htmlFor="cf-type" className="mb-1 block text-sm text-zinc-400">
          Field type
        </label>
        <select
          id="cf-type"
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-default" className="mb-1 block text-sm text-zinc-400">
          Default value (optional)
        </label>
        <textarea
          id="cf-default"
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
      </div>

      <div>
        <label htmlFor="cf-sort" className="mb-1 block text-sm text-zinc-400">
          Sort order
        </label>
        <input
          id="cf-sort"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
          className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isDisplayed}
            onChange={(e) => setIsDisplayed(e.target.checked)}
          />
          Displayed on booking
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
          />
          Required
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
