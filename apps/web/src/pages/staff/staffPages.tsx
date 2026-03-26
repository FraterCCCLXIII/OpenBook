import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  FolderOpen,
  Link2,
  Settings,
  User,
  UserCircle2,
} from 'lucide-react';
import { StaffWorkingPlanEditor } from '../../components/staff/StaffWorkingPlanEditor';
import { StaffFilesTab } from '../../components/staff/StaffFilesTab';
import { StaffRoleFormsTab } from '../../components/staff/StaffRoleFormsTab';
import { StaffMasterDetailLayout } from '../../components/staff/StaffMasterDetailLayout';
import {
  StaffRecordListPanel,
  StaffRecordPlaceholder,
} from '../../components/staff/StaffRecordListPanel';
import { apiJson } from '../../lib/api';
import { TIMEZONE_GROUPS } from '../../lib/timezones';

export { StaffCalendarPage } from './StaffCalendarPage';

function MessageBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
      {children}
    </div>
  );
}

type PaymentTransaction = {
  id: number;
  appointmentId: string;
  amount: string | null;
  currency: string | null;
  status: string;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
  receiptUrl: string | null;
  createdAt: string | null;
  serviceName: string | null;
  customerName: string | null;
};

export function StaffBillingPage() {
  const qc = useQueryClient();
  const [refundError, setRefundError] = useState<string | null>(null);
  const [partialCentsById, setPartialCentsById] = useState<Record<number, string>>({});
  const summary = useQuery({
    queryKey: ['staff', 'billing', 'summary'],
    queryFn: () =>
      apiJson<{
        ok: boolean;
        stripe: { configured: boolean; mode: string | null };
        payments: {
          succeededCount: number;
          pendingCount?: number;
          refundedCount?: number;
          partiallyRefundedCount?: number;
          failedCount?: number;
          totalCount?: number;
        };
      }>('/api/staff/billing/summary'),
  });
  const transactions = useQuery({
    queryKey: ['staff', 'billing', 'transactions'],
    queryFn: () =>
      apiJson<{ items: PaymentTransaction[] }>('/api/staff/billing/transactions'),
  });

  const refundMut = useMutation({
    mutationFn: (args: { paymentId: number; amountCents?: number }) =>
      apiJson(
        `/api/staff/billing/refund/${args.paymentId}`,
        {
          method: 'POST',
          body:
            args.amountCents != null
              ? JSON.stringify({ amountCents: args.amountCents })
              : '{}',
        },
      ),
    onSuccess: () => {
      setRefundError(null);
      void qc.invalidateQueries({ queryKey: ['staff', 'billing'] });
    },
    onError: (e) => {
      setRefundError(e instanceof Error ? e.message : 'Refund failed');
    },
  });

  return (
    <MessageBlock title="Billing">
      {summary.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {summary.isError && (
        <p className="text-sm text-red-400">
          {(summary.error as Error).message}
        </p>
      )}
      {summary.isSuccess && (
        <div className="flex gap-4 text-sm">
          <div className="rounded border border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">Stripe</p>
            <p className="text-zinc-300">
              {summary.data.stripe.configured ? '✓ Configured' : '✗ Not configured'}
              {summary.data.stripe.mode && ` (${summary.data.stripe.mode})`}
            </p>
          </div>
          <div className="rounded border border-zinc-800 p-3">
            <p className="text-xs text-zinc-500">
              Payments (ok / pending / partial / refunded)
            </p>
            <p className="text-lg font-bold text-zinc-100">
              {summary.data.payments.succeededCount}
              {summary.data.payments.pendingCount != null && (
                <span className="text-zinc-500">
                  {' '}
                  / {summary.data.payments.pendingCount} /{' '}
                  {summary.data.payments.partiallyRefundedCount ?? 0} /{' '}
                  {summary.data.payments.refundedCount ?? 0}
                </span>
              )}
            </p>
          </div>
          <div className="self-end">
            <Link to="/staff/settings/stripe" className="text-sm text-emerald-500 underline">
              Stripe settings →
            </Link>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Transactions</h2>
        {refundError && (
          <p className="mb-2 text-sm text-red-400" role="alert">
            {refundError}
          </p>
        )}
        {transactions.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
        {transactions.isSuccess && transactions.data.items.length === 0 && (
          <p className="text-sm text-zinc-500">No transactions yet.</p>
        )}
        {transactions.isSuccess && transactions.data.items.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Receipt</th>
                  <th className="px-3 py-2">Stripe</th>
                  <th className="px-3 py-2">Refund</th>
                </tr>
              </thead>
              <tbody>
                {transactions.data.items.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-800/80">
                    <td className="px-3 py-2 text-zinc-500">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2">{t.customerName ?? '—'}</td>
                    <td className="px-3 py-2">{t.serviceName ?? '—'}</td>
                    <td className="px-3 py-2">
                      {t.amount ? `${t.amount} ${(t.currency ?? '').toUpperCase()}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          t.status === 'succeeded'
                            ? 'text-emerald-400'
                            : t.status === 'partially_refunded'
                              ? 'text-amber-300'
                              : t.status === 'refunded'
                                ? 'text-amber-400'
                                : 'text-zinc-500'
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {t.receiptUrl ? (
                        <a
                          href={t.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-400 underline"
                        >
                          Receipt
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2 font-mono text-[10px] text-zinc-500">
                      {t.stripePaymentIntentId ?? t.stripeCheckoutSessionId ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {(t.status === 'succeeded' || t.status === 'partially_refunded') && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-zinc-500">
                            Partial (cents, optional)
                            <input
                              type="number"
                              min={1}
                              placeholder="full"
                              value={partialCentsById[t.id] ?? ''}
                              onChange={(e) =>
                                setPartialCentsById((prev) => ({
                                  ...prev,
                                  [t.id]: e.target.value,
                                }))
                              }
                              className="ml-1 w-20 rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5 font-mono text-[10px] text-zinc-200"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const raw = partialCentsById[t.id]?.trim();
                              const amountCents =
                                !raw ? undefined : Number.parseInt(raw, 10);
                              if (
                                raw &&
                                (!Number.isFinite(amountCents) ||
                                  (amountCents as number) <= 0)
                              ) {
                                setRefundError('Enter a positive amount in cents or leave empty for full refund.');
                                return;
                              }
                              const msg =
                                amountCents != null
                                  ? `Issue a partial refund of ${amountCents} cents in Stripe?`
                                  : 'Issue a full refund in Stripe for this payment?';
                              if (!window.confirm(msg)) return;
                              setRefundError(null);
                              refundMut.mutate({
                                paymentId: t.id,
                                amountCents,
                              });
                            }}
                            disabled={refundMut.isPending}
                            className="text-left text-xs text-red-400 hover:underline disabled:opacity-50"
                          >
                            Refund
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MessageBlock>
  );
}

export function StaffLogsPage() {
  const q = useQuery({
    queryKey: ['staff', 'audit-logs'],
    queryFn: () => apiJson<{ items: Array<{ id: string; createdAt: string; action: string | null }> }>('/api/staff/audit-logs'),
  });

  return (
    <MessageBlock title="Logs">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && q.data.items.length === 0 && (
        <p className="text-sm text-zinc-500">No audit entries yet.</p>
      )}
      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="space-y-1 font-mono text-xs text-zinc-400">
          {q.data.items.map((l) => (
            <li key={l.id}>
              {l.createdAt} — {l.action ?? '—'}
            </li>
          ))}
        </ul>
      )}
    </MessageBlock>
  );
}

// ─── Shared modal primitives ────────────────────────────────────────────────

function ModalOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-50">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-zinc-400">
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100',
        'placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/50',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={[
        'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100',
        'placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/50',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100',
        'focus:outline-none focus:ring-2 focus:ring-emerald-600/50',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

function FormActions({
  onCancel,
  submitLabel,
  isLoading,
  destructive,
}: {
  onCancel: () => void;
  submitLabel: string;
  isLoading: boolean;
  destructive?: boolean;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className={[
          'rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60',
          destructive
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-emerald-600 hover:bg-emerald-500',
        ].join(' ')}
      >
        {isLoading ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

const SERVICE_COLORS = [
  '#7cbae8', '#acbefb', '#82e4ec', '#7cebc1', '#abe9a4',
  '#ebe07c', '#f3bc7d', '#f3aea6', '#eb8687', '#dfaffe', '#e3e3e3',
];

type ServiceRow = {
  id: string;
  name: string | null;
  duration: number | null;
  price: string | null;
  currency: string | null;
  description: string | null;
  color: string | null;
  location: string | null;
  downPaymentType: string | null;
  downPaymentValue: string | null;
  serviceAreaOnly: number | null;
  categoryId: string | null;
  categoryName: string | null;
  availabilitiesType: string | null;
  attendantsNumber: number | null;
  isPrivate: number | null;
};

function filterServices(items: ServiceRow[], q: string): ServiceRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter((item) => {
    const name = (item.name ?? '').toLowerCase();
    const meta = [item.duration != null ? `${item.duration} min` : '', item.price ?? '']
      .join(' ')
      .toLowerCase();
    return name.includes(s) || meta.includes(s);
  });
}

function ServiceColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SERVICE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          style={{
            backgroundColor: c,
            borderColor: value === c ? 'white' : 'transparent',
          }}
          aria-label={c}
          aria-pressed={value === c}
        >
          {value === c && (
            <svg viewBox="0 0 14 14" className="mx-auto h-3 w-3 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="2,7 6,11 12,3" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

type ServiceFormData = {
  name: string;
  duration: string;
  price: string;
  currency: string;
  description: string;
  color: string;
  location: string;
  downPaymentType: string;
  downPaymentValue: string;
  serviceAreaOnly: boolean;
  availabilitiesType: string;
  attendantsNumber: string;
  isPrivate: boolean;
  categoryId: string;
};

function ServiceModal({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial?: ServiceRow;
  categories: CategoryRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<ServiceFormData>({
    name: initial?.name ?? '',
    duration: initial?.duration?.toString() ?? '30',
    price: initial?.price ?? '',
    currency: initial?.currency ?? 'USD',
    description: initial?.description ?? '',
    color: initial?.color ?? SERVICE_COLORS[0],
    location: initial?.location ?? '',
    downPaymentType: initial?.downPaymentType ?? 'none',
    downPaymentValue: initial?.downPaymentValue ?? '',
    serviceAreaOnly: !!(initial?.serviceAreaOnly),
    availabilitiesType: initial?.availabilitiesType ?? 'flexible',
    attendantsNumber: initial?.attendantsNumber?.toString() ?? '1',
    isPrivate: !!(initial?.isPrivate),
    categoryId: initial?.categoryId ?? '',
  });
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        duration: form.duration ? Number(form.duration) : undefined,
        price: form.price.trim() || null,
        currency: form.currency || 'USD',
        description: form.description.trim() || null,
        color: form.color || null,
        location: form.location.trim() || null,
        down_payment_type: form.downPaymentType,
        down_payment_value: form.downPaymentValue.trim() || null,
        service_area_only: form.serviceAreaOnly ? 1 : 0,
        availabilities_type: form.availabilitiesType,
        attendants_number: form.attendantsNumber ? Number(form.attendantsNumber) : 1,
        is_private: form.isPrivate ? 1 : 0,
        id_service_categories: form.categoryId || null,
      };
      if (isEdit) {
        return apiJson(`/api/staff/services/${initial!.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      return apiJson('/api/staff/services', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e) => setErr((e as Error).message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim()) { setErr('Name is required'); return; }
    mut.mutate();
  }

  const set = <K extends keyof ServiceFormData>(key: K, val: ServiceFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <ModalOverlay title={isEdit ? 'Edit service' : 'New service'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-1">
        <FormRow>
          <FieldLabel htmlFor="svc-name">Name *</FieldLabel>
          <TextInput
            id="svc-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Haircut"
            autoFocus
          />
        </FormRow>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="svc-duration">Duration (minutes)</FieldLabel>
            <TextInput
              id="svc-duration"
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
              placeholder="30"
            />
          </div>
          <div>
            <FieldLabel htmlFor="svc-price">Price</FieldLabel>
            <TextInput
              id="svc-price"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="svc-dp-type">Down Payment Type</FieldLabel>
            <SelectInput
              id="svc-dp-type"
              value={form.downPaymentType}
              onChange={(e) => set('downPaymentType', e.target.value)}
            >
              <option value="none">None</option>
              <option value="fixed">Fixed Amount</option>
              <option value="percent">Percent</option>
            </SelectInput>
          </div>
          {form.downPaymentType !== 'none' && (
            <div>
              <FieldLabel htmlFor="svc-dp-value">Down Payment Value</FieldLabel>
              <TextInput
                id="svc-dp-value"
                type="number"
                min={0}
                step={0.01}
                value={form.downPaymentValue}
                onChange={(e) => set('downPaymentValue', e.target.value)}
                placeholder={form.downPaymentType === 'percent' ? '0–100' : '0.00'}
              />
            </div>
          )}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="svc-currency">Currency</FieldLabel>
            <TextInput
              id="svc-currency"
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
              placeholder="USD"
            />
          </div>
          <div>
            <FieldLabel htmlFor="svc-category">Category</FieldLabel>
            <SelectInput
              id="svc-category"
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
              ))}
            </SelectInput>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="svc-avail-type">Availabilities Type</FieldLabel>
            <SelectInput
              id="svc-avail-type"
              value={form.availabilitiesType}
              onChange={(e) => set('availabilitiesType', e.target.value)}
            >
              <option value="flexible">Flexible</option>
              <option value="fixed">Fixed</option>
            </SelectInput>
          </div>
          <div>
            <FieldLabel htmlFor="svc-attendants">Attendants Number</FieldLabel>
            <TextInput
              id="svc-attendants"
              type="number"
              min={1}
              value={form.attendantsNumber}
              onChange={(e) => set('attendantsNumber', e.target.value)}
            />
          </div>
        </div>

        <FormRow>
          <FieldLabel htmlFor="svc-location">Location</FieldLabel>
          <TextInput
            id="svc-location"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Optional location…"
          />
        </FormRow>

        <FormRow>
          <FieldLabel htmlFor="svc-color">Color</FieldLabel>
          <ServiceColorPicker value={form.color} onChange={(c) => set('color', c)} />
        </FormRow>

        <div className="mb-4 space-y-3 rounded-lg border border-zinc-700 p-3">
          <p className="text-xs font-medium text-zinc-400">Options</p>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => set('isPrivate', e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-600 focus:ring-emerald-600/50"
            />
            <div>
              <span className="block text-sm text-zinc-200">Hide From Public</span>
              <span className="block text-xs text-zinc-500">Won't appear on the booking page</span>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.serviceAreaOnly}
              onChange={(e) => set('serviceAreaOnly', e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-600 focus:ring-emerald-600/50"
            />
            <div>
              <span className="block text-sm text-zinc-200">Only show providers in service area</span>
              <span className="block text-xs text-zinc-500">Limit providers to those serving the customer's ZIP code</span>
            </div>
          </label>
        </div>

        <FormRow>
          <FieldLabel htmlFor="svc-desc">Description</FieldLabel>
          <TextArea
            id="svc-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional description…"
          />
        </FormRow>

        {err && <p className="mb-3 text-sm text-red-400">{err}</p>}
        <FormActions onCancel={onClose} submitLabel={isEdit ? 'Save changes' : 'Create service'} isLoading={mut.isPending} />
      </form>
    </ModalOverlay>
  );
}

function ServiceDeleteModal({
  service,
  onClose,
  onDeleted,
}: {
  service: ServiceRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/services/${service.id}`, { method: 'DELETE' }),
    onSuccess: () => { onDeleted(); onClose(); },
    onError: (e) => setErr((e as Error).message),
  });

  return (
    <ModalOverlay title="Delete service" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
        <p className="text-sm text-zinc-300">
          Are you sure you want to delete <strong className="text-zinc-100">{service.name ?? `Service ${service.id}`}</strong>? This cannot be undone.
        </p>
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <FormActions onCancel={onClose} submitLabel="Delete" isLoading={mut.isPending} destructive />
      </form>
    </ModalOverlay>
  );
}

function ServiceActionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Actions"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      >
        <svg viewBox="0 0 4 18" className="h-4 w-4 fill-current" aria-hidden>
          <circle cx="2" cy="2" r="1.5" />
          <circle cx="2" cy="9" r="1.5" />
          <circle cx="2" cy="16" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-40 rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current text-zinc-500" aria-hidden>
              <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828zM5 12v3H2v-3l8-8 3 3-8 8z" />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path fillRule="evenodd" d="M9 2a1 1 0 0 0-.894.553L7.382 4H4a1 1 0 0 0 0 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a1 1 0 1 0 0-2h-3.382l-.724-1.447A1 1 0 0 0 11 2H9zM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8zm4 0a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V8z" clipRule="evenodd" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function StaffServicesPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['staff', 'services'],
    queryFn: () => apiJson<{ items: ServiceRow[] }>('/api/staff/services'),
  });
  const catQ = useQuery({
    queryKey: ['staff', 'service-categories'],
    queryFn: () => apiJson<{ items: CategoryRow[] }>('/api/staff/service-categories'),
  });

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);

  const filtered = useMemo(
    () => (q.isSuccess ? filterServices(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  const selected = q.isSuccess ? q.data.items.find((s) => s.id === selectedId) : undefined;
  const categories = catQ.isSuccess ? catQ.data.items : [];

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['staff', 'services'] });
  }

  return (
    <>
      <StaffMasterDetailLayout
        panel={
          <StaffRecordListPanel
            id="filter-services"
            title="Services"
            searchValue={filter}
            onSearchChange={setFilter}
            addButton={{ label: '+ Add', onClick: () => setModal('create') }}
          >
            {q.isPending && (
              <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>
            )}
            {q.isError && (
              <p className="px-4 py-6 text-sm text-red-400">{(q.error as Error).message}</p>
            )}
            {q.isSuccess && filtered.length === 0 && (
              <p className="px-4 py-6 text-sm text-zinc-500">No matching services.</p>
            )}
            {q.isSuccess && filtered.length > 0 && (
              <ul className="divide-y divide-zinc-800">
                {filtered.map((s) => {
                  const isSelected = selectedId === s.id;
                  const meta = [
                    s.duration != null ? `${s.duration} min` : null,
                    s.price != null ? `${s.price}${s.currency ? ` ${s.currency}` : ''}` : null,
                    s.categoryName ?? null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className={[
                          'w-full px-3.5 py-3.5 text-left transition-colors',
                          isSelected
                            ? 'border-l-[3px] border-emerald-500 bg-zinc-800/90 pl-[calc(0.875rem-3px)]'
                            : 'hover:bg-zinc-900/80',
                        ].join(' ')}
                        aria-pressed={isSelected}
                      >
                        <div className="flex items-center gap-2">
                          {s.color && (
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: s.color }}
                              aria-hidden
                            />
                          )}
                          <strong className="block text-sm font-semibold text-zinc-100">
                            {s.name ?? `Service ${s.id}`}
                          </strong>
                        </div>
                        {meta && (
                          <span className="mt-1 block text-xs leading-snug text-zinc-500">
                            {meta}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </StaffRecordListPanel>
        }
        detail={
          selected ? (
            <div className="w-full space-y-6">
              <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {selected.color && (
                      <span
                        className="h-4 w-4 shrink-0 rounded-full ring-1 ring-white/10"
                        style={{ backgroundColor: selected.color }}
                        aria-hidden
                      />
                    )}
                    <h2 className="text-xl font-semibold text-zinc-50">
                      {selected.name ?? `Service ${selected.id}`}
                    </h2>
                  </div>
                  <ServiceActionsMenu
                    onEdit={() => setModal('edit')}
                    onDelete={() => setModal('delete')}
                  />
                </div>

                {selected.description ? (
                  <p className="text-sm leading-relaxed text-zinc-400">{selected.description}</p>
                ) : (
                  <p className="text-sm text-zinc-500">No description.</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Category</span>
                    <div className="text-sm text-zinc-200">
                      {selected.categoryName ?? '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Duration</span>
                    <div className="text-sm text-zinc-200">
                      {selected.duration != null ? `${selected.duration} min` : '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Price</span>
                    <div className="text-sm text-zinc-200">
                      {selected.price != null
                        ? `${selected.price}${selected.currency ? ` ${selected.currency}` : ''}`
                        : '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Down payment</span>
                    <div className="text-sm text-zinc-200">
                      {selected.downPaymentType && selected.downPaymentType !== 'none'
                        ? `${selected.downPaymentValue ?? '0'}${selected.downPaymentType === 'percent' ? '%' : ` ${selected.currency ?? ''}`}`
                        : '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Availabilities</span>
                    <div className="text-sm capitalize text-zinc-200">
                      {selected.availabilitiesType ?? 'flexible'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Attendants</span>
                    <div className="text-sm text-zinc-200">
                      {selected.attendantsNumber ?? 1}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Location</span>
                    <div className="text-sm text-zinc-200">
                      {selected.location ?? '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Visibility</span>
                    <div className="text-sm text-zinc-200">
                      {selected.isPrivate ? 'Private' : 'Public'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">Service area</span>
                    <div className="text-sm text-zinc-200">
                      {selected.serviceAreaOnly ? 'Providers in area only' : '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500">ID</span>
                    <div className="font-mono text-xs text-zinc-500">{selected.id}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <StaffRecordPlaceholder message="Select a service from the list." />
          )
        }
      />

      {modal === 'create' && (
        <ServiceModal
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={invalidate}
        />
      )}
      {modal === 'edit' && selected && (
        <ServiceModal
          initial={selected}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={invalidate}
        />
      )}
      {modal === 'delete' && selected && (
        <ServiceDeleteModal
          service={selected}
          onClose={() => setModal(null)}
          onDeleted={() => { setSelectedId(null); invalidate(); }}
        />
      )}
    </>
  );
}

// ─── Service Categories ───────────────────────────────────────────────────────

type CategoryRow = { id: string; name: string | null; description: string | null };

function filterCategories(items: CategoryRow[], q: string): CategoryRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter((c) => {
    const name = (c.name ?? '').toLowerCase();
    const desc = (c.description ?? '').toLowerCase();
    return name.includes(s) || desc.includes(s);
  });
}

function CategoryModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: CategoryRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [desc, setDesc] = useState(initial?.description ?? '');
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async () => {
      const body = { name: name.trim(), description: desc.trim() || null };
      if (isEdit) {
        return apiJson(`/api/staff/service-categories/${initial!.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      return apiJson('/api/staff/service-categories', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => { onSaved(); onClose(); },
    onError: (e) => setErr((e as Error).message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) { setErr('Name is required'); return; }
    mut.mutate();
  }

  return (
    <ModalOverlay title={isEdit ? 'Edit category' : 'New category'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <FieldLabel htmlFor="cat-name">Name *</FieldLabel>
          <TextInput
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hair & Beauty"
            autoFocus
          />
        </FormRow>
        <FormRow>
          <FieldLabel htmlFor="cat-desc">Description</FieldLabel>
          <TextArea
            id="cat-desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Optional description…"
          />
        </FormRow>
        {err && <p className="mb-3 text-sm text-red-400">{err}</p>}
        <FormActions onCancel={onClose} submitLabel={isEdit ? 'Save changes' : 'Create category'} isLoading={mut.isPending} />
      </form>
    </ModalOverlay>
  );
}

function CategoryDeleteModal({
  category,
  onClose,
  onDeleted,
}: {
  category: CategoryRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/service-categories/${category.id}`, { method: 'DELETE' }),
    onSuccess: () => { onDeleted(); onClose(); },
    onError: (e) => setErr((e as Error).message),
  });

  return (
    <ModalOverlay title="Delete category" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
        <p className="text-sm text-zinc-300">
          Are you sure you want to delete <strong className="text-zinc-100">{category.name ?? `Category ${category.id}`}</strong>? Services assigned to this category will be unlinked.
        </p>
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        <FormActions onCancel={onClose} submitLabel="Delete" isLoading={mut.isPending} destructive />
      </form>
    </ModalOverlay>
  );
}

export function StaffServiceCategoriesPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['staff', 'service-categories'],
    queryFn: () => apiJson<{ items: CategoryRow[] }>('/api/staff/service-categories'),
  });

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);

  const filtered = useMemo(
    () => (q.isSuccess ? filterCategories(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  const selected = q.isSuccess ? q.data.items.find((c) => c.id === selectedId) : undefined;

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['staff', 'service-categories'] });
  }

  return (
    <>
      <StaffMasterDetailLayout
        panel={
          <StaffRecordListPanel
            id="filter-service-categories"
            title="Service categories"
            searchValue={filter}
            onSearchChange={setFilter}
            addButton={{ label: '+ Add', onClick: () => setModal('create') }}
          >
            {q.isPending && (
              <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>
            )}
            {q.isError && (
              <p className="px-4 py-6 text-sm text-red-400">{(q.error as Error).message}</p>
            )}
            {q.isSuccess && filtered.length === 0 && (
              <p className="px-4 py-6 text-sm text-zinc-500">No matching categories.</p>
            )}
            {q.isSuccess && filtered.length > 0 && (
              <ul className="divide-y divide-zinc-800">
                {filtered.map((c) => {
                  const isSelected = selectedId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={[
                          'w-full px-3.5 py-3.5 text-left transition-colors',
                          isSelected
                            ? 'border-l-[3px] border-emerald-500 bg-zinc-800/90 pl-[calc(0.875rem-3px)]'
                            : 'hover:bg-zinc-900/80',
                        ].join(' ')}
                        aria-pressed={isSelected}
                      >
                        <strong className="block text-sm font-semibold text-zinc-100">
                          {c.name ?? '—'}
                        </strong>
                        {c.description && (
                          <span className="mt-1 line-clamp-2 block text-xs leading-snug text-zinc-500">
                            {c.description}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </StaffRecordListPanel>
        }
        detail={
          selected ? (
            <div className="w-full space-y-6">
              <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold text-zinc-50">{selected.name ?? '—'}</h2>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setModal('edit')}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal('delete')}
                      className="rounded-lg border border-red-800/60 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {selected.description ? (
                  <p className="text-sm leading-relaxed text-zinc-400">{selected.description}</p>
                ) : (
                  <p className="text-sm text-zinc-500">No description.</p>
                )}

                <div className="space-y-1">
                  <span className="text-xs text-zinc-500">ID</span>
                  <div className="font-mono text-xs text-zinc-500">{selected.id}</div>
                </div>
              </div>
            </div>
          ) : (
            <StaffRecordPlaceholder message="Select a category from the list." />
          )
        }
      />

      {modal === 'create' && (
        <CategoryModal onClose={() => setModal(null)} onSaved={invalidate} />
      )}
      {modal === 'edit' && selected && (
        <CategoryModal initial={selected} onClose={() => setModal(null)} onSaved={invalidate} />
      )}
      {modal === 'delete' && selected && (
        <CategoryDeleteModal
          category={selected}
          onClose={() => setModal(null)}
          onDeleted={() => { setSelectedId(null); invalidate(); }}
        />
      )}
    </>
  );
}

type TeamRow = {
  id: string;
  displayName: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

type TeamMemberDetail = TeamRow & { phoneNumber: string | null };

function filterTeam(items: TeamRow[], q: string): TeamRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (u) =>
      u.displayName.toLowerCase().includes(s) ||
      (u.email ?? '').toLowerCase().includes(s),
  );
}

type TeamTab = 'details' | 'settings' | 'forms' | 'files';

const TEAM_TABS: { id: TeamTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'details', label: 'Details', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'forms', label: 'Forms', icon: ClipboardList },
  { id: 'files', label: 'Files', icon: FolderOpen },
];

function TeamMemberDetailPanel({
  selectedId,
  roleSlug,
  onDeleted,
}: {
  selectedId: string;
  roleSlug: string;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TeamTab>('details');

  const detailQ = useQuery({
    queryKey: ['staff', 'team', roleSlug, selectedId],
    queryFn: () =>
      apiJson<TeamMemberDetail>(`/api/staff/team/${roleSlug}/${selectedId}`),
    enabled: Boolean(selectedId),
  });

  const updateMut = useMutation({
    mutationFn: (body: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
    }) =>
      apiJson<TeamMemberDetail>(`/api/staff/team/${roleSlug}/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void qc.setQueryData(['staff', 'team', roleSlug, selectedId], data);
      void qc.invalidateQueries({ queryKey: ['staff', 'team', roleSlug] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/team/${roleSlug}/${selectedId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'team', roleSlug] });
      onDeleted();
    },
  });

  if (detailQ.isPending)
    return <p className="text-sm text-zinc-500">Loading…</p>;
  if (detailQ.isError)
    return (
      <p className="text-sm text-red-400">{(detailQ.error as Error).message}</p>
    );

  const member = detailQ.data;
  const inputCls =
    'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-xl font-semibold text-zinc-50">{member.displayName}</h2>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
          {member.email && <span>{member.email}</span>}
          {member.phoneNumber && <span>{member.phoneNumber}</span>}
          <span className="font-mono text-xs">ID {member.id}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/30 p-1">
        {TEAM_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-zinc-700 text-zinc-50'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <form
          key={member.id}
          className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateMut.mutate({
              firstName: String(fd.get('first_name') ?? ''),
              lastName: String(fd.get('last_name') ?? ''),
              email: String(fd.get('email') ?? ''),
              phoneNumber: String(fd.get('phone_number') ?? ''),
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">First name</span>
              <input
                name="first_name"
                defaultValue={member.firstName ?? ''}
                className={inputCls}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Last name</span>
              <input
                name="last_name"
                defaultValue={member.lastName ?? ''}
                className={inputCls}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={member.email ?? ''}
              className={inputCls}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Phone</span>
            <input
              name="phone_number"
              defaultValue={member.phoneNumber ?? ''}
              className={inputCls}
            />
          </label>
          {updateMut.isError && (
            <p className="text-xs text-red-400">{(updateMut.error as Error).message}</p>
          )}
          {updateMut.isSuccess && (
            <p className="text-xs text-emerald-500">Saved.</p>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {updateMut.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (window.confirm('Delete this user? This cannot be undone.')) {
                  deleteMut.mutate();
                }
              }}
              className="rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
          {deleteMut.isError && (
            <p className="text-xs text-red-400">{(deleteMut.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
          <p className="text-sm text-zinc-500">Settings coming soon.</p>
        </div>
      )}

      {/* Forms tab */}
      {activeTab === 'forms' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
          <StaffRoleFormsTab roleSlug={roleSlug} userId={selectedId} />
        </div>
      )}

      {/* Files tab */}
      {activeTab === 'files' && (
        <StaffFilesTab
          basePath={`/api/staff/team/${roleSlug}/${selectedId}`}
          queryKey={['staff', 'team', roleSlug, selectedId]}
        />
      )}
    </div>
  );
}

function StaffTeamListPage({
  roleSlug,
  title,
  filterId,
}: {
  roleSlug: string;
  title: string;
  filterId: string;
}) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['staff', 'team', roleSlug],
    queryFn: () =>
      apiJson<{ items: TeamRow[] }>(`/api/staff/team/${roleSlug}`),
  });

  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(
    () => (q.isSuccess ? filterTeam(q.data.items, filter) : []),
    [q.isSuccess, q.data, filter],
  );

  const createMut = useMutation({
    mutationFn: (body: {
      firstName: string;
      lastName: string;
      email: string;
      username: string;
      password: string;
    }) =>
      apiJson(`/api/staff/team/${roleSlug}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'team', roleSlug] });
      setShowCreate(false);
    },
  });

  function CreateTeamUserModal() {
    if (!showCreate) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-semibold text-zinc-100">
            New {roleSlug.charAt(0).toUpperCase() + roleSlug.slice(1)}
          </h3>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMut.mutate({
                firstName: String(fd.get('first_name') ?? ''),
                lastName: String(fd.get('last_name') ?? ''),
                email: String(fd.get('email') ?? ''),
                username: String(fd.get('username') ?? ''),
                password: String(fd.get('password') ?? ''),
              });
            }}
          >
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">First name</span>
              <input name="first_name" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Last name</span>
              <input name="last_name" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Email *</span>
              <input name="email" type="email" required className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Username *</span>
              <input name="username" required autoComplete="username" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Password *</span>
              <input name="password" type="password" required autoComplete="new-password" className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" />
            </label>
            {createMut.isError && (
              <p className="text-xs text-red-400">{(createMut.error as Error).message}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={createMut.isPending}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {createMut.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <StaffMasterDetailLayout
        panel={
          <StaffRecordListPanel
            id={filterId}
            title={title}
            searchValue={filter}
            onSearchChange={setFilter}
            headerExtra={
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-lg border border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-950/50"
              >
                + Add
              </button>
            }
          >
            {q.isPending && (
              <p className="px-4 py-6 text-sm text-zinc-500">Loading…</p>
            )}
            {q.isError && (
              <p className="px-4 py-6 text-sm text-red-400">{(q.error as Error).message}</p>
            )}
            {q.isSuccess && filtered.length === 0 && (
              <p className="px-4 py-6 text-sm text-zinc-500">No matching users.</p>
            )}
            {q.isSuccess && filtered.length > 0 && (
              <ul className="divide-y divide-zinc-800">
                {filtered.map((u) => {
                  const isSelected = selectedId === u.id;
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(u.id)}
                        className={[
                          'w-full px-3.5 py-3.5 text-left transition-colors',
                          isSelected
                            ? 'border-l-[3px] border-emerald-500 bg-zinc-800/90 pl-[calc(0.875rem-3px)]'
                            : 'hover:bg-zinc-900/80',
                        ].join(' ')}
                        aria-pressed={isSelected}
                      >
                        <strong className="block text-sm font-semibold text-zinc-100">
                          {u.displayName}
                        </strong>
                        {u.email && (
                          <span className="mt-1 block text-xs leading-snug text-zinc-500">
                            {u.email}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </StaffRecordListPanel>
        }
        detail={
          selectedId ? (
            <TeamMemberDetailPanel
              key={selectedId}
              selectedId={selectedId}
              roleSlug={roleSlug}
              onDeleted={() => setSelectedId(null)}
            />
          ) : (
            <StaffRecordPlaceholder message="Select a user from the list." />
          )
        }
      />
      <CreateTeamUserModal />
    </>
  );
}

export const StaffSecretariesPage = () => (
  <StaffTeamListPage roleSlug="secretary" title="Secretaries" filterId="filter-secretaries" />
);
export const StaffAdminsPage = () => (
  <StaffTeamListPage roleSlug="admin" title="Administrators" filterId="filter-admins" />
);

export function StaffSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">Admin settings</h1>
      <p className="text-sm text-zinc-500">
        Choose a section. Values are patched via <code className="text-zinc-600">PATCH /api/staff/settings</code>.
      </p>
      <nav className="flex flex-wrap gap-2">
        {[
          ['general', 'General'],
          ['business', 'Business'],
          ['booking', 'Booking'],
          ['api', 'API'],
          ['stripe', 'Stripe'],
          ['service-areas', 'Service areas'],
          ['ldap', 'LDAP'],
        ].map(([path, label]) => (
          <Link
            key={path}
            to={`/staff/settings/${path}`}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
          >
            {label}
          </Link>
        ))}
      </nav>
      <p className="text-xs text-zinc-600">
        Tip: open <Link to="/staff/settings/general" className="text-emerald-500">General</Link> to edit
        company name and other keys from the full settings list.
      </p>
    </div>
  );
}

type StaffAccountDto = {
  workingPlan: string | null;
  workingPlanExceptions: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  timezone: string | null;
  language: string | null;
};

const ACCOUNT_NAV = [
  { path: 'profile', label: 'Profile', icon: UserCircle2 },
  { path: 'working-hours', label: 'Working hours', icon: Calendar },
  { path: 'integrations', label: 'Integrations', icon: Link2 },
] as const;

const accountNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-zinc-800 text-zinc-50'
      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
  ].join(' ');

export function StaffAccountLayout() {
  return (
    <div className="-m-6 flex h-dvh overflow-hidden md:flex-row">
      <nav
        className="hidden w-48 shrink-0 overflow-y-auto border-r border-zinc-800 px-3 py-6 md:flex md:flex-col"
        aria-label="Account sections"
      >
        <h1 className="mb-3 px-3 text-2xl font-semibold text-zinc-50">Account</h1>
        <ul className="flex flex-col gap-0.5">
          {ACCOUNT_NAV.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink to={`/staff/account/${path}`} className={accountNavLinkClass}>
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="min-w-0">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2';

export function StaffAccountProfileSection() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['staff', 'account'],
    queryFn: () => apiJson<StaffAccountDto>('/api/staff/account'),
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState('');

  useEffect(() => {
    if (!q.data) return;
    setFirstName(q.data.firstName ?? '');
    setLastName(q.data.lastName ?? '');
    setEmail(q.data.email ?? '');
    setPhoneNumber(q.data.phoneNumber ?? '');
    setAddress(q.data.address ?? '');
    setCity(q.data.city ?? '');
    setState(q.data.state ?? '');
    setZipCode(q.data.zipCode ?? '');
    setTimezone(q.data.timezone ?? '');
    setLanguage(q.data.language ?? '');
  }, [q.data]);

  const timezoneOptions = useMemo(() => TIMEZONE_GROUPS.flatMap((g) => g.options), []);

  const save = useMutation({
    mutationFn: (body: Record<string, string | null>) =>
      apiJson('/api/staff/account', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['staff', 'account'] }),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({
          first_name: firstName || null,
          last_name: lastName || null,
          email: email || null,
          phone_number: phoneNumber || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip_code: zipCode || null,
          timezone: timezone || null,
          language: language || null,
        });
      }}
    >
      <h2 className="text-lg font-medium text-zinc-100">Profile</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">First name</span>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">Last name</span>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-xs uppercase text-zinc-500">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">Phone</span>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputCls} />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-xs uppercase text-zinc-500">Address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">State</span>
          <input value={state} onChange={(e) => setState(e.target.value)} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">ZIP</span>
          <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">Timezone</span>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
            <option value="">— Default / browser —</option>
            {timezoneOptions.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs uppercase text-zinc-500">Language</span>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. english"
            className={inputCls}
          />
        </label>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        {save.isError && <p className="text-sm text-red-400">{(save.error as Error).message}</p>}
        {save.isSuccess && !save.isPending && <p className="text-sm text-emerald-500">Saved.</p>}
      </div>
    </form>
  );
}

export function StaffAccountWorkingHoursSection() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['staff', 'account'],
    queryFn: () => apiJson<StaffAccountDto>('/api/staff/account'),
  });

  const [workingPlan, setWorkingPlan] = useState('{}');
  const [exceptions, setExceptions] = useState('{}');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.data) return;
    setWorkingPlan(q.data.workingPlan ?? '{}');
    setExceptions(q.data.workingPlanExceptions ?? '{}');
  }, [q.data]);

  const save = useMutation({
    mutationFn: (body: Record<string, string | null>) =>
      apiJson('/api/staff/account', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      setFormError(null);
      void qc.invalidateQueries({ queryKey: ['staff', 'account'] });
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Save failed'),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  return (
    <form
      className="max-w-xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setFormError(null);
        try { JSON.parse(workingPlan || '{}'); } catch { setFormError('Working plan must be valid JSON.'); return; }
        if (exceptions.trim()) {
          try { JSON.parse(exceptions); } catch { setFormError('Exceptions must be valid JSON (or empty).'); return; }
        }
        save.mutate({
          working_plan: workingPlan,
          working_plan_exceptions: exceptions.trim() || null,
        });
      }}
    >
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-100">Working hours</h2>
        <p className="text-xs text-zinc-500">
          Set your weekly availability. Each active day supports break windows.
        </p>
        <StaffWorkingPlanEditor workingPlanJson={workingPlan} onWorkingPlanChange={setWorkingPlan} />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-zinc-300">Exceptions</h3>
        <p className="text-xs text-zinc-500">
          JSON object for date-specific overrides (same format as <code className="text-zinc-600">working_plan_exceptions</code>).
        </p>
        <textarea
          value={exceptions}
          onChange={(e) => setExceptions(e.target.value)}
          rows={6}
          spellCheck={false}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
        />
      </div>
      {formError && <p className="text-sm text-red-400" role="alert">{formError}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        {save.isSuccess && !save.isPending && <p className="text-sm text-emerald-500">Saved.</p>}
      </div>
    </form>
  );
}

export function StaffAccountIntegrationsSection() {
  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-medium text-zinc-100">Integrations</h2>
      <GoogleCalendarSection />
    </div>
  );
}

/** @deprecated Use StaffAccountLayout + section routes instead */
export function StaffAccountPage() {
  return null;
}

function GoogleCalendarSection() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ['integrations', 'google', 'status'],
    queryFn: () =>
      apiJson<{ connected: boolean; calendarId: string | null }>(
        '/api/integrations/google/status',
      ),
  });

  const disconnect = useMutation({
    mutationFn: () =>
      apiJson('/api/integrations/google/disconnect', { method: 'DELETE' }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['integrations', 'google'] }),
  });

  function handleConnect() {
    window.location.href = '/api/integrations/google/auth';
  }

  return (
    <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-zinc-200">Google Calendar</h3>
      {status.isPending && <p className="text-xs text-zinc-500">Checking status…</p>}
      {status.isSuccess && (
        status.data.connected ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-emerald-400">✓ Connected{status.data.calendarId ? ` (${status.data.calendarId})` : ''}</span>
            <button
              type="button"
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
              className="rounded px-3 py-1 text-xs text-red-400 border border-red-900/50 hover:bg-red-900/20 disabled:opacity-50"
            >
              {disconnect.isPending ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Connect Google Calendar
          </button>
        )
      )}
    </div>
  );
}

export function StaffProviderBookingsPage() {
  const q = useQuery({
    queryKey: ['staff', 'provider-bookings'],
    queryFn: () =>
      apiJson<{
        items: Array<{
          id: string;
          startDatetime: string | null;
          serviceName: string | null;
          customerName: string | null;
        }>;
      }>('/api/staff/provider/bookings'),
  });

  return (
    <MessageBlock title="Provider bookings">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && q.data.items.length === 0 && (
        <p className="text-sm text-zinc-500">No bookings assigned to you.</p>
      )}
      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="space-y-2">
          {q.data.items.map((a) => (
            <li key={a.id}>
              <Link
                to={`/staff/provider/bookings/${a.id}`}
                className="block rounded border border-zinc-800 px-3 py-2 text-sm transition-colors hover:border-zinc-600"
              >
                <div className="text-zinc-100">{a.serviceName ?? 'Appointment'}</div>
                {a.startDatetime && (
                  <div className="text-xs text-zinc-500">{new Date(a.startDatetime).toLocaleString()}</div>
                )}
                {a.customerName && <div className="text-xs text-zinc-400">{a.customerName}</div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MessageBlock>
  );
}
