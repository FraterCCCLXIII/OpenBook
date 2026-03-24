import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { apiJson } from '../../lib/api';
import { csrfHeaders, ensureCsrfToken } from '../../lib/csrf';

type CustomerNoteRow = {
  id: string;
  notes: string | null;
  createDatetime: string | null;
};

type CustomerAlertRow = {
  id: string;
  message: string | null;
  isRead: number;
  createDatetime: string | null;
};

type CustomFieldRow = {
  id: number;
  name: string;
  fieldType: string;
  isRequired: number;
  value: string;
};

type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  notes: CustomerNoteRow[];
  alerts: CustomerAlertRow[];
  customFields: CustomFieldRow[];
};

export function StaffCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['staff', 'customers', id],
    queryFn: () => apiJson<Customer>(`/api/staff/customers/${encodeURIComponent(id ?? '')}`),
    enabled: Boolean(id),
  });

  const filesQ = useQuery({
    queryKey: ['staff', 'customers', id, 'files'],
    queryFn: () =>
      apiJson<{
        items: Array<{
          id: string;
          originalName: string;
          mimeType: string;
          sizeBytes: number;
          createdAt: string | null;
        }>;
      }>(`/api/staff/customers/${encodeURIComponent(id ?? '')}/files`),
    enabled: Boolean(id),
  });

  const deleteFile = useMutation({
    mutationFn: (fileId: string) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/files/${fileId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id, 'files'] });
    },
  });

  const save = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
    },
  });

  const saveCustomFields = useMutation({
    mutationFn: (values: Record<string, string>) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/custom-fields`, {
        method: 'PATCH',
        body: JSON.stringify({ values }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
    },
  });

  const addNote = useMutation({
    mutationFn: (notes: string) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/notes/${noteId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
    },
  });

  const addAlert = useMutation({
    mutationFn: (message: string) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/alerts`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
    },
  });

  const patchAlert = useMutation({
    mutationFn: (args: { alertId: string; is_read?: number; message?: string }) =>
      apiJson(
        `/api/staff/customers/${encodeURIComponent(id ?? '')}/alerts/${args.alertId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            ...(args.is_read !== undefined ? { is_read: args.is_read } : {}),
            ...(args.message !== undefined ? { message: args.message } : {}),
          }),
        },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: (alertId: string) =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}/alerts/${alertId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers', id] });
    },
  });

  const deleteM = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/customers/${encodeURIComponent(id ?? '')}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff', 'customers'] });
      void navigate('/staff/customers');
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && (
        <>
          <form
            key={q.data.id}
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              save.mutate({
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
            <h1 className="text-2xl font-semibold text-zinc-50">
              {[q.data.firstName, q.data.lastName].filter(Boolean).join(' ') || 'Customer'}
            </h1>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">First name</span>
                <input
                  name="first_name"
                  defaultValue={q.data.firstName ?? ''}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Last name</span>
                <input
                  name="last_name"
                  defaultValue={q.data.lastName ?? ''}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Email</span>
              <input
                name="email"
                type="email"
                defaultValue={q.data.email ?? ''}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Phone</span>
              <input
                name="phone_number"
                defaultValue={q.data.phoneNumber ?? ''}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-500">Address</span>
              <input
                name="address"
                defaultValue={q.data.address ?? ''}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">City</span>
                <input
                  name="city"
                  defaultValue={q.data.city ?? ''}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">ZIP</span>
                <input
                  name="zip_code"
                  defaultValue={q.data.zipCode ?? ''}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={save.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
              >
                {save.isPending ? 'Saving…' : 'Save profile'}
              </button>
              <button
                type="button"
                disabled={deleteM.isPending}
                onClick={() => {
                  if (confirm('Delete this customer?')) deleteM.mutate();
                }}
                className="rounded-lg border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 disabled:opacity-50"
              >
                {deleteM.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
            {save.isError && (
              <p className="text-xs text-red-400">{(save.error as Error).message}</p>
            )}
          </form>

          {q.data.customFields.length > 0 && (
            <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Custom fields
              </h2>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const values: Record<string, string> = {};
                  for (const f of q.data.customFields) {
                    values[String(f.id)] = String(fd.get(`cf_${f.id}`) ?? '');
                  }
                  saveCustomFields.mutate(values);
                }}
              >
                {q.data.customFields.map((f) => (
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
                        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        name={`cf_${f.id}`}
                        defaultValue={f.value}
                        required={f.isRequired === 1}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                      />
                    )}
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={saveCustomFields.isPending}
                  className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saveCustomFields.isPending ? 'Saving…' : 'Save custom fields'}
                </button>
              </form>
            </section>
          )}

          <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Notes</h2>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const text = String(fd.get('new_note') ?? '').trim();
                if (!text) return;
                addNote.mutate(text);
                (e.currentTarget as HTMLFormElement).reset();
              }}
            >
              <textarea
                name="new_note"
                rows={2}
                placeholder="Add a note…"
                className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={addNote.isPending}
                className="shrink-0 rounded-lg bg-zinc-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {addNote.isPending ? 'Adding…' : 'Add note'}
              </button>
            </form>
            <ul className="space-y-2">
              {q.data.notes.length === 0 && (
                <li className="text-sm text-zinc-500">No notes yet.</li>
              )}
              {q.data.notes.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start justify-between gap-2 rounded border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300"
                >
                  <div>
                    <p className="whitespace-pre-wrap">{n.notes}</p>
                    {n.createDatetime && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(n.createDatetime).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Remove this note?')) deleteNote.mutate(n.id);
                    }}
                    className="shrink-0 text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Alerts</h2>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const text = String(fd.get('new_alert') ?? '').trim();
                if (!text) return;
                addAlert.mutate(text);
                (e.currentTarget as HTMLFormElement).reset();
              }}
            >
              <input
                name="new_alert"
                placeholder="Alert message…"
                className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={addAlert.isPending}
                className="shrink-0 rounded-lg bg-amber-900/50 px-4 py-2 text-sm text-amber-200 disabled:opacity-50"
              >
                {addAlert.isPending ? 'Adding…' : 'Add alert'}
              </button>
            </form>
            <ul className="space-y-2">
              {q.data.alerts.length === 0 && (
                <li className="text-sm text-zinc-500">No alerts.</li>
              )}
              {q.data.alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-sm"
                >
                  <label className="flex flex-1 items-start gap-2 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={a.isRead === 1}
                      onChange={(e) =>
                        patchAlert.mutate({
                          alertId: a.id,
                          is_read: e.target.checked ? 1 : 0,
                        })
                      }
                      className="mt-0.5 accent-emerald-500"
                    />
                    <span className={a.isRead === 1 ? 'text-zinc-500 line-through' : ''}>
                      {a.message}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this alert?')) deleteAlert.mutate(a.id);
                    }}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Files <span className="font-normal text-zinc-600">(ea_user_files)</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Attachments stored on the API host under <code className="text-zinc-600">uploads/user-files</code>.
            </p>
            <label className="block text-xs text-zinc-500">
              Upload
              <input
                type="file"
                className="mt-1 block w-full text-sm text-zinc-300 file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-1.5 file:text-zinc-100"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file || !id) return;
                  await ensureCsrfToken();
                  const fd = new FormData();
                  fd.append('file', file);
                  const res = await fetch(
                    `/api/staff/customers/${encodeURIComponent(id)}/files`,
                    {
                      method: 'POST',
                      credentials: 'include',
                      headers: csrfHeaders(),
                      body: fd,
                    },
                  );
                  if (!res.ok) {
                    alert('Upload failed');
                    return;
                  }
                  void qc.invalidateQueries({ queryKey: ['staff', 'customers', id, 'files'] });
                }}
              />
            </label>
            {filesQ.isPending && <p className="text-xs text-zinc-500">Loading files…</p>}
            {filesQ.isSuccess && filesQ.data.items.length === 0 && (
              <p className="text-sm text-zinc-500">No files yet.</p>
            )}
            {filesQ.isSuccess && filesQ.data.items.length > 0 && (
              <ul className="space-y-1 text-sm text-zinc-300">
                {filesQ.data.items.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded border border-zinc-800/80 px-2 py-1"
                  >
                    <span className="min-w-0 truncate" title={f.originalName}>
                      {f.originalName}{' '}
                      <span className="text-xs text-zinc-500">
                        ({f.sizeBytes} bytes{f.createdAt ? ` · ${new Date(f.createdAt).toLocaleString()}` : ''})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Remove this file?')) deleteFile.mutate(f.id);
                      }}
                      className="shrink-0 text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
