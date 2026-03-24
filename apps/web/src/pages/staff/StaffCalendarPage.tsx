import { useCallback, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  DatesSetArg,
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventResizeDoneArg,
} from '@fullcalendar/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiJson } from '../../lib/api';

type CalItem = {
  id: string;
  type: 'appointment';
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
  serviceName: string | null;
  customerName: string | null;
  providerName: string | null;
  idUsersProvider: string | null;
  idUsersCustomer: string | null;
  idServices: string | null;
};

type BlockedItem = {
  id: number;
  type: 'blocked';
  name: string | null;
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
};

type UnavailItem = {
  id: string;
  type: 'unavailability';
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
  providerName: string | null;
  idUsersProvider: string | null;
};

type CalResponse = {
  items: CalItem[];
  blockedPeriods: BlockedItem[];
  unavailabilities: UnavailItem[];
};

type ModalState =
  | { mode: 'create'; start: string; end: string }
  | { mode: 'edit'; item: CalItem }
  | { mode: 'blocked_create'; start: string; end: string }
  | { mode: 'blocked_edit'; item: BlockedItem }
  | { mode: 'unavail_create'; start: string; end: string }
  | { mode: 'unavail_edit'; item: UnavailItem }
  | null;

type PickerRow = { id: string; label: string };

function toLocalDatetimeValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StaffCalendarPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [range, setRange] = useState(() => {
    const from = new Date();
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);
    return { from, to };
  });
  const [modal, setModal] = useState<ModalState>(null);

  const rangeKey = [range.from.toISOString(), range.to.toISOString()];
  const q = useQuery({
    queryKey: ['staff', 'calendar', 'fc', ...rangeKey],
    queryFn: () =>
      apiJson<CalResponse>(
        `/api/staff/calendar/appointments?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`,
      ),
  });

  const providersQ = useQuery({
    queryKey: ['staff', 'team', 'provider', 'calendar'],
    queryFn: () => apiJson<{ items: Array<{ id: string; displayName: string; email: string | null }> }>('/api/staff/team/provider'),
  });

  const servicesQ = useQuery({
    queryKey: ['staff', 'services', 'calendar'],
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; name: string | null }> }>('/api/staff/services?limit=500&offset=0'),
  });

  const customersQ = useQuery({
    queryKey: ['staff', 'customers', 'calendar'],
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null }> }>(
        '/api/staff/customers?limit=500&offset=0',
      ),
  });

  const providerOptions: PickerRow[] = useMemo(() => {
    const items = providersQ.data?.items ?? [];
    return items.map((p) => ({
      id: p.id,
      label: p.displayName || p.email || `Provider ${p.id}`,
    }));
  }, [providersQ.data]);

  const serviceOptions: PickerRow[] = useMemo(() => {
    const items = servicesQ.data?.items ?? [];
    return items.map((s) => ({
      id: s.id,
      label: s.name || `Service ${s.id}`,
    }));
  }, [servicesQ.data]);

  const customerOptions: PickerRow[] = useMemo(() => {
    const items = customersQ.data?.items ?? [];
    return items.map((c) => {
      const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
      return {
        id: c.id,
        label: name || c.email || `Customer ${c.id}`,
      };
    });
  }, [customersQ.data]);

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ['staff', 'calendar', 'fc', ...rangeKey] });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/staff/calendar/appointments/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const patchApptMut = useMutation({
    mutationFn: (args: { id: string; start: string; end: string }) =>
      apiJson(`/api/staff/calendar/appointments/${args.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ start: args.start, end: args.end }),
      }),
    onSuccess: invalidate,
  });

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({ from: arg.start, to: arg.end });
  }, []);

  const onSelect = useCallback((arg: DateSelectArg) => {
    setModal({ mode: 'create', start: arg.startStr, end: arg.endStr });
  }, []);

  const onEventClick = useCallback((arg: EventClickArg) => {
    const t = arg.event.extendedProps.type as string;
    if (t === 'appointment') {
      const item = arg.event.extendedProps as CalItem;
      setModal({ mode: 'edit', item: { ...item, id: arg.event.id } });
    } else if (t === 'blocked') {
      const b = arg.event.extendedProps as BlockedItem;
      setModal({ mode: 'blocked_edit', item: b });
    } else if (t === 'unavailability') {
      const u = arg.event.extendedProps as UnavailItem;
      setModal({ mode: 'unavail_edit', item: u });
    }
  }, []);

  const onEventDrop = useCallback(
    (info: EventDropArg) => {
      const appt = info.event.extendedProps as CalItem;
      if (appt.type !== 'appointment') {
        info.revert();
        return;
      }
      const start = info.event.start;
      const end = info.event.end ?? info.event.start;
      if (!start || !end) {
        info.revert();
        return;
      }
      patchApptMut.mutate(
        {
          id: appt.id,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        {
          onError: () => info.revert(),
        },
      );
    },
    [patchApptMut],
  );

  const onEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      const appt = info.event.extendedProps as CalItem;
      if (appt.type !== 'appointment') {
        info.revert();
        return;
      }
      const start = info.event.start;
      const end = info.event.end;
      if (!start || !end) {
        info.revert();
        return;
      }
      patchApptMut.mutate(
        {
          id: appt.id,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        {
          onError: () => info.revert(),
        },
      );
    },
    [patchApptMut],
  );

  const appointments = q.data?.items ?? [];
  const blocked = q.data?.blockedPeriods ?? [];
  const unavail = q.data?.unavailabilities ?? [];

  const events = [
    ...appointments.map((ev) => ({
      id: ev.id,
      title: [ev.serviceName, ev.customerName].filter(Boolean).join(' — ') || 'Appointment',
      start: ev.startDatetime ?? undefined,
      end: ev.endDatetime ?? undefined,
      color: '#10b981',
      editable: true,
      durationEditable: true,
      extendedProps: { ...ev, type: 'appointment' as const },
    })),
    ...blocked.map((b) => ({
      id: `blocked-${b.id}`,
      title: b.name ?? 'Blocked',
      start: b.startDatetime ?? undefined,
      end: b.endDatetime ?? undefined,
      color: '#dc2626',
      display: 'background' as const,
      editable: false,
      extendedProps: { ...b, type: 'blocked' as const },
    })),
    ...unavail.map((u) => ({
      id: `unavail-${u.id}`,
      title: `Unavailable${u.providerName ? ` — ${u.providerName}` : ''}`,
      start: u.startDatetime ?? undefined,
      end: u.endDatetime ?? undefined,
      color: '#d97706',
      editable: true,
      durationEditable: true,
      extendedProps: { ...u, type: 'unavailability' as const },
    })),
  ];

  const unavailPatchMut = useMutation({
    mutationFn: (args: { id: string; start: string; end: string; providerId?: string }) =>
      apiJson(`/api/staff/calendar/unavailabilities/${args.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          start: args.start,
          end: args.end,
          ...(args.providerId ? { providerId: args.providerId } : {}),
        }),
      }),
    onSuccess: invalidate,
  });

  const onUnavailDrop = useCallback(
    (info: EventDropArg) => {
      const u = info.event.extendedProps as UnavailItem;
      if (u.type !== 'unavailability') {
        info.revert();
        return;
      }
      const rawId = String(info.event.id).replace(/^unavail-/, '');
      const start = info.event.start;
      const end = info.event.end ?? info.event.start;
      if (!start || !end) {
        info.revert();
        return;
      }
      unavailPatchMut.mutate(
        {
          id: rawId,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        { onError: () => info.revert() },
      );
    },
    [unavailPatchMut],
  );

  const onUnavailResize = useCallback(
    (info: EventResizeDoneArg) => {
      const u = info.event.extendedProps as UnavailItem;
      if (u.type !== 'unavailability') {
        info.revert();
        return;
      }
      const rawId = String(info.event.id).replace(/^unavail-/, '');
      const start = info.event.start;
      const end = info.event.end;
      if (!start || !end) {
        info.revert();
        return;
      }
      unavailPatchMut.mutate(
        {
          id: rawId,
          start: start.toISOString(),
          end: end.toISOString(),
        },
        { onError: () => info.revert() },
      );
    },
    [unavailPatchMut],
  );

  const onEventDropCombined = useCallback(
    (info: EventDropArg) => {
      const typ = info.event.extendedProps.type as string;
      if (typ === 'appointment') onEventDrop(info);
      else if (typ === 'unavailability') onUnavailDrop(info);
      else info.revert();
    },
    [onEventDrop, onUnavailDrop],
  );

  const onEventResizeCombined = useCallback(
    (info: EventResizeDoneArg) => {
      const typ = info.event.extendedProps.type as string;
      if (typ === 'appointment') onEventResize(info);
      else if (typ === 'unavailability') onUnavailResize(info);
      else info.revert();
    },
    [onEventResize, onUnavailResize],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-50">{t('calendar')}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const end = new Date(now.getTime() + 30 * 60_000);
              setModal({ mode: 'blocked_create', start: now.toISOString(), end: end.toISOString() });
            }}
            className="rounded border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:border-red-700"
          >
            + Blocked period
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const end = new Date(now.getTime() + 60 * 60_000);
              setModal({ mode: 'unavail_create', start: now.toISOString(), end: end.toISOString() });
            }}
            className="rounded border border-amber-900 px-3 py-1.5 text-xs text-amber-400 hover:border-amber-700"
          >
            + Unavailability
          </button>
        </div>
      </div>
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      <div className="staff-calendar min-h-[520px] rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 [&_.fc-toolbar-title]:text-zinc-100 [&_.fc-button]:border-zinc-600 [&_.fc-button]:bg-zinc-800 [&_.fc-button]:text-zinc-200">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          selectable
          select={onSelect}
          eventClick={onEventClick}
          events={events}
          height="auto"
          datesSet={onDatesSet}
          editable
          eventDrop={onEventDropCombined}
          eventResize={onEventResizeCombined}
        />
      </div>

      {modal?.mode === 'create' && (
        <AppointmentModal
          start={modal.start}
          end={modal.end}
          providerOptions={providerOptions}
          serviceOptions={serviceOptions}
          customerOptions={customerOptions}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            invalidate();
          }}
        />
      )}

      {modal?.mode === 'edit' && (
        <AppointmentModal
          start={modal.item.startDatetime ?? ''}
          end={modal.item.endDatetime ?? ''}
          existing={modal.item}
          providerOptions={providerOptions}
          serviceOptions={serviceOptions}
          customerOptions={customerOptions}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            invalidate();
          }}
          onDelete={() => {
            deleteMut.mutate(modal.item.id);
            setModal(null);
          }}
        />
      )}

      {modal?.mode === 'blocked_create' && (
        <BlockedPeriodModal
          mode="create"
          start={modal.start}
          end={modal.end}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            invalidate();
          }}
        />
      )}

      {modal?.mode === 'blocked_edit' && (
        <BlockedPeriodModal
          mode="edit"
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            invalidate();
          }}
        />
      )}

      {modal?.mode === 'unavail_create' && (
        <UnavailabilityModal
          mode="create"
          start={modal.start}
          end={modal.end}
          providerOptions={providerOptions}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            invalidate();
          }}
        />
      )}

      {modal?.mode === 'unavail_edit' && (
        <UnavailabilityModal
          mode="edit"
          item={modal.item}
          providerOptions={providerOptions}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function AppointmentModal({
  start: initialStart,
  end: initialEnd,
  existing,
  providerOptions,
  serviceOptions,
  customerOptions,
  onClose,
  onSaved,
  onDelete,
}: {
  start: string;
  end: string;
  existing?: CalItem;
  providerOptions: PickerRow[];
  serviceOptions: PickerRow[];
  customerOptions: PickerRow[];
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const [start, setStart] = useState(() => toLocalDatetimeValue(initialStart));
  const [end, setEnd] = useState(() => toLocalDatetimeValue(initialEnd));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [providerId, setProviderId] = useState(existing?.idUsersProvider ?? '');
  const [customerId, setCustomerId] = useState(existing?.idUsersCustomer ?? '');
  const [serviceId, setServiceId] = useState(existing?.idServices ?? '');
  const [error, setError] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      existing
        ? apiJson(`/api/staff/calendar/appointments/${existing.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : apiJson('/api/staff/calendar/appointments', {
            method: 'POST',
            body: JSON.stringify(body),
          }),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startIso = new Date(start).toISOString();
    const endIso = new Date(end).toISOString();
    saveMut.mutate({
      start: startIso,
      end: endIso,
      notes: notes || undefined,
      providerId: providerId || undefined,
      customerId: customerId || undefined,
      serviceId: serviceId || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          {existing ? 'Edit appointment' : 'New appointment'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Start</span>
            <input
              type="datetime-local"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">End</span>
            <input
              type="datetime-local"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Provider</span>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            >
              <option value="">— Optional —</option>
              {providerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Customer</span>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            >
              <option value="">— Optional —</option>
              {customerOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Service</span>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            >
              <option value="">— Optional —</option>
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Appointment notes</span>
            <span className="mb-1 block text-[11px] text-zinc-600">
              Stored on the appointment record (customer-facing / general).
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            />
          </label>
          {existing && <AppointmentInternalNotes appointmentId={existing.id} />}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saveMut.isPending ? 'Saving…' : 'Save'}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:border-red-700"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AppointmentInternalNotes({ appointmentId }: { appointmentId: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const notesQ = useQuery({
    queryKey: ['staff', 'calendar', 'appointment-notes', appointmentId],
    queryFn: () =>
      apiJson<{
        items: Array<{
          id: string;
          note: string | null;
          createDatetime: string | null;
          authorName: string | null;
        }>;
      }>(`/api/staff/calendar/appointments/${appointmentId}/notes`),
  });

  const addMut = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/calendar/appointments/${appointmentId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: draft }),
      }),
    onSuccess: () => {
      setDraft('');
      void qc.invalidateQueries({
        queryKey: ['staff', 'calendar', 'appointment-notes', appointmentId],
      });
    },
  });

  const delMut = useMutation({
    mutationFn: (noteId: string) =>
      apiJson(
        `/api/staff/calendar/appointments/${appointmentId}/notes/${noteId}`,
        { method: 'DELETE' },
      ),
    onSuccess: () =>
      void qc.invalidateQueries({
        queryKey: ['staff', 'calendar', 'appointment-notes', appointmentId],
      }),
  });

  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Internal notes (CRM)
      </div>
      <p className="text-[11px] text-zinc-600">
        Per-appointment thread in <code className="text-zinc-500">ea_appointment_notes</code>.
      </p>
      {notesQ.isPending && <p className="text-xs text-zinc-500">Loading notes…</p>}
      {notesQ.isError && (
        <p className="text-xs text-red-400">{(notesQ.error as Error).message}</p>
      )}
      {notesQ.isSuccess && notesQ.data.items.length === 0 && (
        <p className="text-xs text-zinc-600">No internal notes yet.</p>
      )}
      {notesQ.isSuccess && notesQ.data.items.length > 0 && (
        <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
          {notesQ.data.items.map((n) => (
            <li
              key={n.id}
              className="rounded border border-zinc-800/80 bg-zinc-900/60 px-2 py-1.5 text-zinc-300"
            >
              <div className="flex justify-between gap-2 text-[10px] text-zinc-500">
                <span>{n.authorName ?? 'Staff'}</span>
                <span>
                  {n.createDatetime
                    ? new Date(n.createDatetime).toLocaleString()
                    : ''}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-zinc-200">{n.note}</p>
              <button
                type="button"
                onClick={() => delMut.mutate(n.id)}
                disabled={delMut.isPending}
                className="mt-1 text-[10px] text-red-400/90 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="block space-y-1">
        <span className="text-xs uppercase text-zinc-500">Add note</span>
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
        />
      </label>
      <button
        type="button"
        disabled={addMut.isPending || !draft.trim()}
        onClick={() => addMut.mutate()}
        className="rounded border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
      >
        {addMut.isPending ? 'Adding…' : 'Add internal note'}
      </button>
    </div>
  );
}

function BlockedPeriodModal({
  mode,
  start,
  end,
  item,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  start?: string;
  end?: string;
  item?: BlockedItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [startVal, setStartVal] = useState(
    () => toLocalDatetimeValue(item?.startDatetime ?? start) || '',
  );
  const [endVal, setEndVal] = useState(
    () => toLocalDatetimeValue(item?.endDatetime ?? end) || '',
  );
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      mode === 'create'
        ? apiJson('/api/staff/calendar/blocked-periods', {
            method: 'POST',
            body: JSON.stringify(body),
          })
        : apiJson(`/api/staff/calendar/blocked-periods/${item!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          }),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  const deleteMut = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/calendar/blocked-periods/${item!.id}`, { method: 'DELETE' }),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof Error ? e.message : 'Delete failed'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMut.mutate({
      name: name || undefined,
      start: new Date(startVal).toISOString(),
      end: new Date(endVal).toISOString(),
      notes: notes || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          {mode === 'create' ? 'New blocked period' : 'Edit blocked period'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
              placeholder="e.g. Holiday"
            />
          </label>
          {[
            { label: 'Start', value: startVal, setter: setStartVal },
            { label: 'End', value: endVal, setter: setEndVal },
          ].map(({ label, value, setter }) => (
            <label key={label} className="block space-y-1">
              <span className="text-xs uppercase text-zinc-500">{label}</span>
              <input
                type="datetime-local"
                value={value}
                onChange={(e) => setter(e.target.value)}
                required
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
              />
            </label>
          ))}
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Notes</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            />
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saveMut.isPending ? 'Saving…' : mode === 'create' ? 'Block period' : 'Save'}
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={() => deleteMut.mutate()}
                disabled={deleteMut.isPending}
                className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:border-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UnavailabilityModal({
  mode,
  start,
  end,
  item,
  providerOptions,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  start?: string;
  end?: string;
  item?: UnavailItem;
  providerOptions: PickerRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [providerId, setProviderId] = useState(item?.idUsersProvider ?? '');
  const [startVal, setStartVal] = useState(
    () => toLocalDatetimeValue(item?.startDatetime ?? start) || '',
  );
  const [endVal, setEndVal] = useState(
    () => toLocalDatetimeValue(item?.endDatetime ?? end) || '',
  );
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      mode === 'create'
        ? apiJson('/api/staff/calendar/unavailabilities', {
            method: 'POST',
            body: JSON.stringify(body),
          })
        : apiJson(`/api/staff/calendar/unavailabilities/${item!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          }),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  const deleteMut = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/calendar/unavailabilities/${item!.id}`, { method: 'DELETE' }),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof Error ? e.message : 'Delete failed'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'create' && !providerId) {
      setError('Provider is required');
      return;
    }
    const body: Record<string, unknown> = {
      start: new Date(startVal).toISOString(),
      end: new Date(endVal).toISOString(),
      notes: notes || undefined,
    };
    if (mode === 'create') {
      body.providerId = providerId;
    } else {
      if (providerId) body.providerId = providerId;
    }
    saveMut.mutate(body);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          {mode === 'create' ? 'New unavailability' : 'Edit unavailability'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Provider *</span>
            <select
              required={mode === 'create'}
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            >
              <option value="">— Select provider —</option>
              {providerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {[
            { label: 'Start', value: startVal, setter: setStartVal },
            { label: 'End', value: endVal, setter: setEndVal },
          ].map(({ label, value, setter }) => (
            <label key={label} className="block space-y-1">
              <span className="text-xs uppercase text-zinc-500">{label}</span>
              <input
                type="datetime-local"
                value={value}
                onChange={(e) => setter(e.target.value)}
                required
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
              />
            </label>
          ))}
          <label className="block space-y-1">
            <span className="text-xs uppercase text-zinc-500">Notes</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
            />
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="flex-1 rounded-lg bg-amber-700 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saveMut.isPending ? 'Saving…' : 'Save'}
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={() => deleteMut.mutate()}
                disabled={deleteMut.isPending}
                className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:border-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
