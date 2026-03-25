import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  Trash2,
  User,
} from 'lucide-react';
import { apiJson } from '../../lib/api';
import { csrfHeaders, ensureCsrfToken } from '../../lib/csrf';

// ─── Types ─────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  notes: { id: string; notes: string | null; createDatetime: string | null }[];
  alerts: {
    id: string;
    message: string | null;
    isRead: number;
    color?: string | null;
    authorName?: string | null;
    createDatetime: string | null;
  }[];
  customFields: {
    id: number;
    name: string;
    fieldType: string;
    isRequired: number;
    value: string;
  }[];
};

type AppointmentRow = {
  id: string;
  startDatetime: string | null;
  endDatetime: string | null;
  serviceName: string | null;
  providerName: string | null;
  status: string;
  hash: string | null;
};

type BillingRow = {
  id: string;
  createDatetime: string | null;
  amount: string | null;
  currency: string | null;
  status: string;
  serviceName: string | null;
  appointmentId: string;
};

type FormRow = {
  id: number;
  name: string;
  completed: boolean;
  submittedAt: string | null;
};

type FileRow = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Completed: 'bg-emerald-900/40 text-emerald-400',
    Booked: 'bg-blue-900/40 text-blue-400',
    'In progress': 'bg-amber-900/40 text-amber-400',
    succeeded: 'bg-emerald-900/40 text-emerald-400',
    pending: 'bg-amber-900/40 text-amber-400',
    failed: 'bg-red-900/40 text-red-400',
    refunded: 'bg-zinc-700 text-zinc-300',
  };
  const cls = map[status] ?? 'bg-zinc-700 text-zinc-300';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

// ─── Tab definitions ────────────────────────────────────────────────────────

type Tab =
  | 'appointments'
  | 'billing'
  | 'notes'
  | 'alerts'
  | 'forms'
  | 'files'
  | 'account';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'forms', label: 'Forms', icon: ClipboardList },
  { id: 'files', label: 'Files', icon: Paperclip },
  { id: 'account', label: 'Account', icon: User },
];

// ─── Sub-panels ─────────────────────────────────────────────────────────────

function AppointmentsTab({ customerId }: { customerId: string }) {
  const q = useQuery({
    queryKey: ['staff', 'customers', customerId, 'appointments'],
    queryFn: () =>
      apiJson<{ items: AppointmentRow[] }>(
        `/api/staff/customers/${encodeURIComponent(customerId)}/appointments`,
      ),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError)
    return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const items = q.data.items;

  if (items.length === 0)
    return (
      <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
        No appointments yet.
      </p>
    );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-2.5">Service</th>
            <th className="px-4 py-2.5">Provider</th>
            <th className="px-4 py-2.5">Date &amp; Time</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {items.map((a) => (
            <tr key={a.id} className="bg-zinc-900/20 hover:bg-zinc-900/50">
              <td className="px-4 py-2.5 font-medium text-zinc-100">
                {a.serviceName ?? '—'}
              </td>
              <td className="px-4 py-2.5 text-zinc-400">{a.providerName ?? '—'}</td>
              <td className="px-4 py-2.5 text-zinc-400">{fmt(a.startDatetime)}</td>
              <td className="px-4 py-2.5">{statusBadge(a.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillingTab({ customerId }: { customerId: string }) {
  const q = useQuery({
    queryKey: ['staff', 'customers', customerId, 'billing'],
    queryFn: () =>
      apiJson<{ items: BillingRow[] }>(
        `/api/staff/customers/${encodeURIComponent(customerId)}/billing`,
      ),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError)
    return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const items = q.data.items;

  if (items.length === 0)
    return (
      <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
        No billing records yet.
      </p>
    );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-2.5">Date</th>
            <th className="px-4 py-2.5">Service</th>
            <th className="px-4 py-2.5">Amount</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {items.map((p) => (
            <tr key={p.id} className="bg-zinc-900/20 hover:bg-zinc-900/50">
              <td className="px-4 py-2.5 text-zinc-400">{fmt(p.createDatetime)}</td>
              <td className="px-4 py-2.5 text-zinc-300">{p.serviceName ?? '—'}</td>
              <td className="px-4 py-2.5 font-medium text-zinc-100">
                {p.amount != null
                  ? `${p.currency?.toUpperCase() ?? ''} ${p.amount}`.trim()
                  : '—'}
              </td>
              <td className="px-4 py-2.5">{statusBadge(p.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotesTab({
  customer,
  onAddNote,
  onDeleteNote,
  addPending,
  deletePending,
}: {
  customer: Customer;
  onAddNote: (text: string) => void;
  onDeleteNote: (id: string) => void;
  addPending: boolean;
  deletePending: boolean;
}) {
  return (
    <div className="space-y-4">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const text = String(fd.get('new_note') ?? '').trim();
          if (!text) return;
          onAddNote(text);
          (e.currentTarget as HTMLFormElement).reset();
        }}
      >
        <textarea
          name="new_note"
          rows={3}
          placeholder="Add a note…"
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={addPending}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
          >
            {addPending ? 'Adding…' : 'Add note'}
          </button>
        </div>
      </form>

      {customer.notes.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          No notes yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {customer.notes.map((n) => (
            <li
              key={n.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-zinc-200">{n.notes}</p>
                {n.createDatetime && (
                  <p className="mt-1 text-xs text-zinc-500">{fmt(n.createDatetime)}</p>
                )}
              </div>
              <button
                type="button"
                disabled={deletePending}
                onClick={() => {
                  if (confirm('Remove this note?')) onDeleteNote(n.id);
                }}
                className="shrink-0 text-zinc-600 hover:text-red-400 disabled:opacity-50"
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AlertsTab({
  customer,
  onAddAlert,
  onDeleteAlert,
  addPending,
}: {
  customer: Customer;
  onAddAlert: (text: string, color: string) => void;
  onDeleteAlert: (id: string) => void;
  addPending: boolean;
}) {
  const orderedAlerts = [...customer.alerts].sort((a, b) => {
    const aTime = a.createDatetime ? new Date(a.createDatetime).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.createDatetime ? new Date(b.createDatetime).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  return (
    <div className="space-y-4">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const text = String(fd.get('new_alert') ?? '').trim();
          const color = String(fd.get('alert_color') ?? 'current');
          if (!text) return;
          onAddAlert(text, color);
          (e.currentTarget as HTMLFormElement).reset();
        }}
      >
        <div className="flex flex-wrap gap-2">
          <input
            name="new_alert"
            placeholder="Alert message…"
            className="min-w-[220px] flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
          <select
            name="alert_color"
            defaultValue="current"
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            aria-label="Alert color"
          >
            <option value="current">Current</option>
            <option value="red">Red</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={addPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {addPending ? 'Adding…' : 'Add alert'}
          </button>
        </div>
      </form>

      {orderedAlerts.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          No alerts.
        </p>
      ) : (
        <ul className="space-y-2">
          {orderedAlerts.map((a) => (
            <li
              key={a.id}
              className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
                a.color === 'red'
                  ? 'border-red-900/40 bg-red-950/25'
                  : 'border-amber-900/40 bg-amber-950/20'
              }`}
            >
              <div className="flex-1 text-sm text-zinc-200">
                <div className="whitespace-pre-wrap break-words">{a.message}</div>
                {(a.createDatetime || a.authorName) && (
                  <div className="mt-1 text-xs text-zinc-500">
                    {[a.createDatetime ? fmt(a.createDatetime) : null, a.authorName]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this alert?')) onDeleteAlert(a.id);
                }}
                className="shrink-0 text-zinc-600 hover:text-red-400"
                aria-label="Delete alert"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormsTab({ customerId }: { customerId: string }) {
  const q = useQuery({
    queryKey: ['staff', 'customers', customerId, 'forms'],
    queryFn: () =>
      apiJson<{ items: FormRow[] }>(
        `/api/staff/customers/${encodeURIComponent(customerId)}/forms`,
      ),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError)
    return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const items = q.data.items;

  if (items.length === 0)
    return (
      <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
        No forms assigned to customers yet.
      </p>
    );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-2.5">Form</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {items.map((f) => (
            <tr key={f.id} className="bg-zinc-900/20 hover:bg-zinc-900/50">
              <td className="px-4 py-2.5 font-medium text-zinc-100">{f.name}</td>
              <td className="px-4 py-2.5">
                {f.completed ? (
                  <span className="inline-flex rounded-full bg-emerald-900/40 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    Complete
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-amber-900/40 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                    Not complete
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-zinc-400">{fmt(f.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilesTab({
  customerId,
  files,
  filesLoading,
  onDelete,
  deletePending,
  onUpload,
}: {
  customerId: string;
  files: FileRow[];
  filesLoading: boolean;
  onDelete: (id: string) => void;
  deletePending: boolean;
  onUpload: (file: File) => Promise<void>;
}) {
  function fmtBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-5 text-sm text-zinc-400 hover:border-zinc-500">
        <Paperclip className="h-4 w-4 shrink-0" />
        <span>Click to upload a file (max 15 MB)</span>
        <input
          type="file"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) await onUpload(file);
          }}
        />
      </label>

      {filesLoading && <p className="text-sm text-zinc-500">Loading files…</p>}

      {!filesLoading && files.length === 0 && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          No files uploaded yet.
        </p>
      )}

      {files.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Size</th>
                <th className="px-4 py-2.5">Uploaded</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {files.map((f) => (
                <tr key={f.id} className="bg-zinc-900/20 hover:bg-zinc-900/50">
                  <td className="max-w-xs truncate px-4 py-2.5 font-medium text-zinc-100" title={f.originalName}>
                    {f.originalName}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">{fmtBytes(f.sizeBytes)}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{fmt(f.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={() => {
                        if (confirm('Remove this file?')) onDelete(f.id);
                      }}
                      className="text-zinc-600 hover:text-red-400 disabled:opacity-50"
                      aria-label="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AccountTab({
  customer,
  onSave,
  onDelete,
  savePending,
  deletePending,
  saveError,
  onSaveCustomFields,
  saveCustomFieldsPending,
}: {
  customer: Customer;
  onSave: (body: Record<string, string>) => void;
  onDelete: () => void;
  savePending: boolean;
  deletePending: boolean;
  saveError: string | null;
  onSaveCustomFields: (values: Record<string, string>) => void;
  saveCustomFieldsPending: boolean;
}) {
  const inputCls =
    'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none';

  return (
    <div className="space-y-6">
      <form
        key={customer.id}
        className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onSave({
            first_name: String(fd.get('first_name') ?? ''),
            last_name: String(fd.get('last_name') ?? ''),
            email: String(fd.get('email') ?? ''),
            phone_number: String(fd.get('phone_number') ?? ''),
            address: String(fd.get('address') ?? ''),
            city: String(fd.get('city') ?? ''),
            zip_code: String(fd.get('zip_code') ?? ''),
          });
        }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Profile
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">First name</span>
            <input name="first_name" defaultValue={customer.firstName ?? ''} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Last name</span>
            <input name="last_name" defaultValue={customer.lastName ?? ''} className={inputCls} />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Email</span>
          <input name="email" type="email" defaultValue={customer.email ?? ''} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Phone</span>
          <input name="phone_number" defaultValue={customer.phoneNumber ?? ''} className={inputCls} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Address</span>
          <input name="address" defaultValue={customer.address ?? ''} className={inputCls} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">City</span>
            <input name="city" defaultValue={customer.city ?? ''} className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">ZIP code</span>
            <input name="zip_code" defaultValue={customer.zipCode ?? ''} className={inputCls} />
          </label>
        </div>
        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={savePending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {savePending ? 'Saving…' : 'Save profile'}
          </button>
          <button
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (confirm('Delete this customer? This cannot be undone.')) onDelete();
            }}
            className="rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 disabled:opacity-50"
          >
            {deletePending ? 'Deleting…' : 'Delete customer'}
          </button>
        </div>
      </form>

      {customer.customFields.length > 0 && (
        <form
          className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const values: Record<string, string> = {};
            for (const f of customer.customFields) {
              values[String(f.id)] = String(fd.get(`cf_${f.id}`) ?? '');
            }
            onSaveCustomFields(values);
          }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Custom fields
          </h3>
          {customer.customFields.map((f) => (
            <label key={f.id} className="block space-y-1">
              <span className="text-xs text-zinc-500">
                {f.name}
                {f.isRequired ? ' *' : ''}
              </span>
              {f.fieldType === 'textarea' ? (
                <textarea
                  name={`cf_${f.id}`}
                  rows={3}
                  defaultValue={f.value}
                  required={f.isRequired === 1}
                  className={inputCls}
                />
              ) : (
                <input
                  name={`cf_${f.id}`}
                  defaultValue={f.value}
                  required={f.isRequired === 1}
                  className={inputCls}
                />
              )}
            </label>
          ))}
          <button
            type="submit"
            disabled={saveCustomFieldsPending}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {saveCustomFieldsPending ? 'Saving…' : 'Save custom fields'}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function StaffCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('appointments');

  const q = useQuery({
    queryKey: ['staff', 'customers', id],
    queryFn: () =>
      apiJson<Customer>(`/api/staff/customers/${encodeURIComponent(id ?? '')}`),
    enabled: Boolean(id),
  });

  const filesQ = useQuery({
    queryKey: ['staff', 'customers', id, 'files'],
    queryFn: () =>
      apiJson<{ items: FileRow[] }>(
        `/api/staff/customers/${encodeURIComponent(id ?? '')}/files`,
      ),
    enabled: Boolean(id),
  });

  const invalidateCustomer = () => {
    void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
  };

  const save = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      invalidateCustomer();
    },
  });

  const saveCustomFields = useMutation({
    mutationFn: (values: Record<string, string>) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/custom-fields`, {
        method: 'PATCH',
        body: JSON.stringify({ values }),
      }),
    onSuccess: invalidateCustomer,
  });

  const addNote = useMutation({
    mutationFn: (notes: string) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    onSuccess: invalidateCustomer,
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) =>
      apiJson(
        `/api/staff/customers/${encodeURIComponent(id ?? '')}/notes/${noteId}`,
        { method: 'DELETE' },
      ),
    onSuccess: invalidateCustomer,
  });

  const addAlert = useMutation({
    mutationFn: (payload: { message: string; color: string }) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/alerts`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidateCustomer,
  });

  const deleteAlert = useMutation({
    mutationFn: (alertId: string) =>
      apiJson(
        `/api/staff/customers/${encodeURIComponent(id ?? '')}/alerts/${alertId}`,
        { method: 'DELETE' },
      ),
    onSuccess: invalidateCustomer,
  });

  const deleteFile = useMutation({
    mutationFn: (fileId: string) =>
      apiJson(
        `/api/staff/customers/${encodeURIComponent(id ?? '')}/files/${fileId}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id, 'files'] });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      void navigate('/staff/customers');
    },
  });

  async function uploadFile(file: File) {
    if (!id) return;
    await ensureCsrfToken();
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(
      `/api/staff/customers/${encodeURIComponent(id)}/files`,
      { method: 'POST', credentials: 'include', headers: csrfHeaders(), body: fd },
    );
    if (!res.ok) {
      alert('Upload failed');
      return;
    }
    void qc.invalidateQueries({ queryKey: ['staff', 'customers', id, 'files'] });
  }

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError)
    return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const customer = q.data;
  const name =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
  const unreadAlerts = customer.alerts.filter((a) => a.isRead === 0).length;
  return (
    <div className="space-y-5">
      {/* Summary header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">{name}</h1>
            <p className="mt-1 text-xs text-zinc-600">ID: {customer.id}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
          {customer.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              {customer.email}
            </span>
          )}
          {customer.phoneNumber && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              {customer.phoneNumber}
            </span>
          )}
          {(customer.address || customer.city) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              {[customer.address, customer.city, customer.zipCode]
                .filter(Boolean)
                .join(', ')}
            </span>
          )}
        </div>
        {customer.alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {customer.alerts.map((alert) => (
              <div
                key={alert.id}
                className={[
                  'rounded-lg border px-4 py-3 text-sm',
                  alert.color === 'red'
                    ? 'border-red-900/40 bg-red-950/25 text-red-100'
                    : 'border-amber-900/40 bg-amber-950/30 text-amber-100',
                ].join(' ')}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={[
                      'mt-0.5 h-4 w-4 shrink-0',
                      alert.color === 'red' ? 'text-red-300' : 'text-amber-300',
                    ].join(' ')}
                  />
                  <div className="whitespace-pre-wrap break-words">{alert.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/30 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-700 text-zinc-50'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {t.label}
              {t.id === 'alerts' && unreadAlerts > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {activeTab === 'appointments' && <AppointmentsTab customerId={customer.id} />}
      {activeTab === 'billing' && <BillingTab customerId={customer.id} />}
      {activeTab === 'notes' && (
        <NotesTab
          customer={customer}
          onAddNote={(text) => addNote.mutate(text)}
          onDeleteNote={(noteId) => deleteNote.mutate(noteId)}
          addPending={addNote.isPending}
          deletePending={deleteNote.isPending}
        />
      )}
      {activeTab === 'alerts' && (
        <AlertsTab
          customer={customer}
          onAddAlert={(text, color) => addAlert.mutate({ message: text, color })}
          onDeleteAlert={(alertId) => deleteAlert.mutate(alertId)}
          addPending={addAlert.isPending}
        />
      )}
      {activeTab === 'forms' && <FormsTab customerId={customer.id} />}
      {activeTab === 'files' && (
        <FilesTab
          customerId={customer.id}
          files={filesQ.data?.items ?? []}
          filesLoading={filesQ.isPending}
          onDelete={(fileId) => deleteFile.mutate(fileId)}
          deletePending={deleteFile.isPending}
          onUpload={uploadFile}
        />
      )}
      {activeTab === 'account' && (
        <AccountTab
          customer={customer}
          onSave={(body) => save.mutate(body)}
          onDelete={() => deleteCustomer.mutate()}
          savePending={save.isPending}
          deletePending={deleteCustomer.isPending}
          saveError={save.isError ? (save.error as Error).message : null}
          onSaveCustomFields={(values) => saveCustomFields.mutate(values)}
          saveCustomFieldsPending={saveCustomFields.isPending}
        />
      )}
    </div>
  );
}
