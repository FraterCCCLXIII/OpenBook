import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlignLeft, CalendarDays, CheckSquare, ChevronDown, ChevronLeft,
  CircleDot, Copy, FileText, GripVertical,
  List, ListOrdered, TextCursorInput, Trash2, Type,
} from 'lucide-react';
import { RichTextEditor } from '../../components/staff/RichTextEditor';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type FormField = {
  _uid: number;
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
  roleAssignments: string[];
};

type FormDetail = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  fields: Omit<FormField, '_uid'>[];
  roleAssignments: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_TYPES: { value: string; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'provider', label: 'Provider' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'admin', label: 'Admin' },
];

const FIELD_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'textblock', label: 'Text block' },
  { value: 'input', label: 'Input' },
  { value: 'text', label: 'Long text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'date', label: 'Date' },
];

const ADD_BUTTONS: { type: string; label: string; icon: LucideIcon }[] = [
  { type: 'textblock', label: 'Text', icon: Type },
  { type: 'input', label: 'Input', icon: TextCursorInput },
  { type: 'text', label: 'Long text', icon: AlignLeft },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'radio', label: 'Radio', icon: CircleDot },
  { type: 'checkboxes', label: 'Checkboxes', icon: CheckSquare },
  { type: 'date', label: 'Date', icon: CalendarDays },
];

// ─── UID helpers ──────────────────────────────────────────────────────────────

let _uidCtr = 0;
function nextUid() { return ++_uidCtr; }

function withUids(fields: Omit<FormField, '_uid'>[]): FormField[] {
  return fields.map((f) => ({ ...f, _uid: nextUid() }));
}

function blankField(type: string): FormField {
  return {
    _uid: nextUid(),
    label: type === 'textblock' ? '<p></p>' : '',
    fieldType: type,
    options: [],
    isRequired: false,
    sortOrder: 0,
  };
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────

// ─── UserTypeDropdown ─────────────────────────────────────────────────────────

function UserTypeDropdown({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const label = value.length === 0
    ? 'None selected'
    : value.map((v) => USER_TYPES.find((t) => t.value === v)?.label ?? v).join(', ');

  return (
    <div className="space-y-1">
      <span className="text-xs uppercase text-zinc-500">Assigned user types</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
        >
          <span className={value.length === 0 ? 'text-zinc-500' : ''}>{label}</span>
          <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
            {USER_TYPES.map(({ value: v, label: l }) => (
              <label key={v} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
                <input
                  type="checkbox"
                  checked={value.includes(v)}
                  onChange={(e) => onChange(e.target.checked ? [...value, v] : value.filter((r) => r !== v))}
                  className="accent-emerald-500"
                />
                {l}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FormFieldCard (pure visual, no sortable logic) ───────────────────────────

type FieldCardProps = {
  field: FormField;
  /** Passed from useSortable – undefined when rendering in DragOverlay */
  dragHandleProps?: Record<string, unknown>;
  /** True while this item is the one being dragged (fades the placeholder) */
  isDragging?: boolean;
  /** True when rendered inside DragOverlay (floating clone) */
  isOverlay?: boolean;
  onUpdate: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
};

function FormFieldCard({
  field,
  dragHandleProps = {},
  isDragging = false,
  isOverlay = false,
  onUpdate,
  onRemove,
  onDuplicate,
}: FieldCardProps) {
  const isTextBlock = field.fieldType === 'textblock';
  const hasOptions = ['dropdown', 'radio', 'checkboxes'].includes(field.fieldType);

  function handleTypeChange(newType: string) {
    const patch: Partial<FormField> = { fieldType: newType, options: [] };
    if (newType === 'textblock') {
      patch.label = field.fieldType !== 'textblock' && field.label ? `<p>${field.label}</p>` : '<p></p>';
      patch.isRequired = false;
    } else if (field.fieldType === 'textblock') {
      patch.label = '';
    }
    onUpdate(patch);
  }

  return (
    <div
      className={[
        'rounded-lg border bg-zinc-900/40 transition-shadow',
        isDragging ? 'border-zinc-700 opacity-40' : 'border-zinc-800',
        isOverlay ? 'shadow-2xl ring-1 ring-emerald-500/30 rotate-[0.5deg]' : '',
      ].join(' ')}
    >
      {/* ── Body ── */}
      <div className="flex items-start gap-2 p-3">
        {/* Grip — always top-left, never stretches */}
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
          title="Reorder"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          {isTextBlock ? (
            isOverlay ? (
              /* Lightweight preview in overlay so Tiptap doesn't remount */
              <div
                className="richtext min-h-[48px] rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                dangerouslySetInnerHTML={{ __html: field.label }}
              />
            ) : (
              <RichTextEditor value={field.label} onChange={(html) => onUpdate({ label: html })} />
            )
          ) : (
            <input
              type="text"
              placeholder="Field label"
              required={!isOverlay}
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            />
          )}

          <select
            value={field.fieldType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 outline-none ring-emerald-500/50 focus:ring-2"
          >
            {FIELD_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {hasOptions && !isOverlay && (
            <textarea
              rows={2}
              placeholder="Options — one per line"
              value={field.options.join('\n')}
              onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter(Boolean) })}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 outline-none ring-emerald-500/50 focus:ring-2"
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2">
        {!isTextBlock ? (
          <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-zinc-400">
            <button
              type="button"
              role="switch"
              aria-checked={field.isRequired}
              onClick={() => !isOverlay && onUpdate({ isRequired: !field.isRequired })}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${field.isRequired ? 'bg-emerald-600' : 'bg-zinc-700'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${field.isRequired ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
            Required
          </label>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => !isOverlay && onDuplicate()}
            title="Duplicate"
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => !isOverlay && onRemove()}
            title="Delete"
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SortableFormFieldCard ────────────────────────────────────────────────────

function SortableFormFieldCard(props: Omit<FieldCardProps, 'dragHandleProps' | 'isDragging' | 'isOverlay'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(props.field._uid) });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      <FormFieldCard
        {...props}
        dragHandleProps={{ ...attributes, ...listeners } as Record<string, unknown>}
        isDragging={isDragging}
      />
    </div>
  );
}

// ─── FormPreview ──────────────────────────────────────────────────────────────

function FormPreview({ formId, onBack }: { formId: number; onBack: () => void }) {
  const q = useQuery({
    queryKey: ['staff', 'forms', formId],
    queryFn: () => apiJson<FormDetail>(`/api/staff/forms/${formId}`),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const form = q.data;
  const sortedFields = form.fields.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const typeLabel: Record<string, string> = {
    input: 'Short text', text: 'Long text', dropdown: 'Dropdown',
    radio: 'Radio', checkboxes: 'Checkboxes', date: 'Date', textblock: 'Text block',
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to forms
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">{form.name}</h2>
          {form.description && <p className="mt-1 text-sm text-zinc-500">{form.description}</p>}
        </div>
        <span className="shrink-0 rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500">
          Preview
        </span>
      </div>

      <div className="space-y-3">
        {sortedFields.map((field) => {
          if (field.fieldType === 'textblock') {
            return (
              <div
                key={field.id}
                className="richtext rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-zinc-300"
                dangerouslySetInnerHTML={{ __html: field.label }}
              />
            );
          }
          return (
            <div key={field.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">
                  {field.label}
                  {field.isRequired && <span className="ml-1 text-red-400">*</span>}
                </span>
                <span className="text-xs text-zinc-600">{typeLabel[field.fieldType] ?? field.fieldType}</span>
              </div>

              {(field.fieldType === 'input' || field.fieldType === 'date' || field.fieldType === 'text') && (
                <div className={`rounded border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-600 ${field.fieldType === 'text' ? 'min-h-[64px]' : ''}`}>
                  {typeLabel[field.fieldType]}…
                </div>
              )}
              {field.fieldType === 'dropdown' && (
                <div className="rounded border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-600">
                  {field.options[0] ? `${field.options[0]}…` : 'Select…'}
                </div>
              )}
              {(field.fieldType === 'radio' || field.fieldType === 'checkboxes') && (
                <div className="space-y-1.5">
                  {field.options.slice(0, 3).map((opt) => (
                    <div key={opt} className="flex items-center gap-2 text-sm text-zinc-500">
                      <div className={`h-3.5 w-3.5 shrink-0 border border-zinc-600 ${field.fieldType === 'radio' ? 'rounded-full' : 'rounded'}`} />
                      {opt}
                    </div>
                  ))}
                  {field.options.length > 3 && (
                    <p className="text-xs text-zinc-600">+{field.options.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── StaffFormsPage ───────────────────────────────────────────────────────────

export function StaffFormsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState<number | null>(null);
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
    mutationFn: (id: number) => apiJson(`/api/staff/forms/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'forms'] });
      setSelected(null);
    },
  });

  // ── Preview mode ──
  if (previewing !== null) {
    return <FormPreview formId={previewing} onBack={() => setPreviewing(null)} />;
  }

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
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                <FileText className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-100">{f.name}</p>
                <p className="text-xs text-zinc-500">
                  {f.fieldCount} field{f.fieldCount !== 1 ? 's' : ''}
                  {f.roleAssignments.length > 0
                    ? ` · ${f.roleAssignments.map((r) => USER_TYPES.find((t) => t.value === r)?.label ?? r).join(', ')}`
                    : ' · No user types assigned'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewing(f.id)}
                  className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => { setSelected(f.id); setCreating(false); }}
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
          onSave={() => { void qc.invalidateQueries({ queryKey: ['staff', 'forms'] }); setCreating(false); }}
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

// ─── FormEditor ───────────────────────────────────────────────────────────────

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
    initial?.fields ? withUids(initial.fields) : [blankField('input')],
  );
  const [roleAssignments, setRoleAssignments] = useState<string[]>(initial?.roleAssignments ?? []);
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<FormField | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const saveMutation = useMutation({
    mutationFn: (body: {
      name: string;
      description: string;
      fields: Omit<FormField, '_uid'>[];
      roleAssignments: string[];
    }) =>
      initial
        ? apiJson(`/api/staff/forms/${initial.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : apiJson('/api/staff/forms', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: onSave,
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  function addField(type: string) {
    setFields((f) => [...f, blankField(type)]);
  }

  function removeField(uid: number) {
    setFields((f) => f.filter((field) => field._uid !== uid));
  }

  function duplicateField(uid: number) {
    setFields((f) => {
      const idx = f.findIndex((field) => field._uid === uid);
      if (idx === -1) return f;
      const clone = { ...f[idx], _uid: nextUid(), id: undefined };
      const next = [...f];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }

  function updateField(uid: number, patch: Partial<FormField>) {
    setFields((f) => f.map((field) => field._uid === uid ? { ...field, ...patch } : field));
  }

  function handleDragStart(e: DragStartEvent) {
    const field = fields.find((f) => String(f._uid) === String(e.active.id));
    setActiveField(field ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveField(null);
    if (!over || active.id === over.id) return;
    setFields((f) => {
      const oldIdx = f.findIndex((field) => String(field._uid) === String(active.id));
      const newIdx = f.findIndex((field) => String(field._uid) === String(over.id));
      return arrayMove(f, oldIdx, newIdx);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const serialized = fields.map(({ _uid, ...rest }, idx) => ({ ...rest, sortOrder: idx }));
    saveMutation.mutate({ name: name.trim(), description: description.trim(), fields: serialized, roleAssignments });
  }

  const noop = () => {};

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-lg font-medium text-zinc-100">{initial ? 'Edit form' : 'New form'}</h2>

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

      <UserTypeDropdown value={roleAssignments} onChange={setRoleAssignments} />

      {/* Field list */}
      <div className="space-y-2">
          <span className="text-xs uppercase text-zinc-500">Fields</span>

        {fields.length === 0 && (
          <p className="text-sm text-zinc-600">No fields yet — add one below.</p>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={fields.map((f) => String(f._uid))} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableFormFieldCard
                  key={field._uid}
                  field={field}
                  onUpdate={(patch) => updateField(field._uid, patch)}
                  onRemove={() => removeField(field._uid)}
                  onDuplicate={() => duplicateField(field._uid)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
            {activeField ? (
              <FormFieldCard
                field={activeField}
                isOverlay
                onUpdate={noop}
                onRemove={noop}
                onDuplicate={noop}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {ADD_BUTTONS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => addField(type)}
              className="flex items-center gap-1.5 rounded border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
          </div>
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
