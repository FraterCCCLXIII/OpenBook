import { useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, DateSelectArg, EventClickArg } from '@fullcalendar/core';
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
};

type CalResponse = {
  items: CalItem[];
  blockedPeriods: BlockedItem[];
  unavailabilities: Array<{
    id: string;
    startDatetime: string | null;
    endDatetime: string | null;
    providerName: string | null;
    idUsersProvider: string | null;
  }>;
};

type ModalState =
  | { mode: 'create'; start: string; end: string }
  | { mode: 'edit'; item: CalItem }
  | { mode: 'blocked'; start: string; end: string }
  | null;

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

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ['staff', 'calendar', 'fc', ...rangeKey] });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/staff/calendar/appointments/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({ from: arg.start, to: arg.end });
  }, []);

  const onSelect = useCallback((arg: DateSelectArg) => {
    setModal({ mode: 'create', start: arg.startStr, end: arg.endStr });
  }, []);

  const onEventClick = useCallback(
    (arg: EventClickArg) => {
      if (arg.event.extendedProps.type === 'appointment') {
        const item = arg.event.extendedProps as CalItem;
        setModal({ mode: 'edit', item: { ...item, id: arg.event.id } });
      } else if (arg.event.extendedProps.type === 'blocked') {
        // Just show info for blocked periods for now
      }
    },
    [],
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
      extendedProps: { ...ev, type: 'appointment' },
    })),
    ...blocked.map((b) => ({
      id: `blocked-${b.id}`,
      title: b.name ?? 'Blocked',
      start: b.startDatetime ?? undefined,
      end: b.endDatetime ?? undefined,
      color: '#dc2626',
      display: 'background',
      extendedProps: { ...b, type: 'blocked' },
    })),
    ...unavail.map((u) => ({
      id: `unavail-${u.id}`,
      title: `Unavailable${u.providerName ? ` — ${u.providerName}` : ''}`,
      start: u.startDatetime ?? undefined,
      end: u.endDatetime ?? undefined,
      color: '#d97706',
      editable: false,
      extendedProps: { ...u, type: 'unavailability' },
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-50">{t('calendar')}</h1>
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            const end = new Date(now.getTime() + 30 * 60_000);
            setModal({ mode: 'blocked', start: now.toISOString(), end: end.toISOString() });
          }}
          className="rounded border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:border-red-700"
        >
          + Blocked period
        </button>
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
        />
      </div>

      {modal?.mode === 'create' && (
        <AppointmentModal
          start={modal.start}
          end={modal.end}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); invalidate(); }}
        />
      )}

      {modal?.mode === 'edit' && (
        <AppointmentModal
          start={modal.item.startDatetime ?? ''}
          end={modal.item.endDatetime ?? ''}
          existing={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); invalidate(); }}
          onDelete={() => {
            deleteMut.mutate(modal.item.id);
            setModal(null);
          }}
        />
      )}

      {modal?.mode === 'blocked' && (
        <BlockedPeriodModal
          start={modal.start}
          end={modal.end}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); invalidate(); }}
        />
      )}
    </div>
  );
}

function AppointmentModal({
  start,
  end,
  existing,
  onClose,
  onSaved,
  onDelete,
}: {
  start: string;
  end: string;
  existing?: CalItem;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}) {
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
    saveMut.mutate({
      start,
      end,
      notes: notes || undefined,
      providerId: providerId || undefined,
      customerId: customerId || undefined,
      serviceId: serviceId || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          {existing ? 'Edit appointment' : 'New appointment'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm text-zinc-400">
            <div>
              <span className="text-xs uppercase text-zinc-500">Start</span>
              <p>{new Date(start).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-zinc-500">End</span>
              <p>{new Date(end).toLocaleString()}</p>
            </div>
          </div>
          {[
            { label: 'Provider ID', value: providerId, setter: setProviderId },
            { label: 'Customer ID', value: customerId, setter: setCustomerId },
            { label: 'Service ID', value: serviceId, setter: setServiceId },
          ].map(({ label, value, setter }) => (
            <label key={label} className="block space-y-1">
              <span className="text-xs uppercase text-zinc-500">{label}</span>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
                placeholder="optional"
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

function BlockedPeriodModal({
  start,
  end,
  onClose,
  onSaved,
}: {
  start: string;
  end: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [startVal, setStartVal] = useState(start.slice(0, 16));
  const [endVal, setEndVal] = useState(end.slice(0, 16));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const saveMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiJson('/api/staff/calendar/blocked-periods', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: onSaved,
    onError: (e) => setError(e instanceof Error ? e.message : 'Save failed'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMut.mutate({ name: name || undefined, start: startVal, end: endVal, notes: notes || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">New blocked period</h2>
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
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saveMut.isPending ? 'Saving…' : 'Block period'}
            </button>
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
