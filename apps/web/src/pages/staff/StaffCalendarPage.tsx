import { useCallback, useMemo, useRef, useState } from 'react';
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
} from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ChevronDown,
  Filter,
  MoreVertical,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { apiJson } from '../../lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_COLORS = [
  '#7cbae8',
  '#acbefb',
  '#82e4ec',
  '#7cebc1',
  '#abe9a4',
  '#ebe07c',
  '#f3bc7d',
  '#f3aea6',
  '#eb8687',
  '#dfaffe',
  '#e3e3e3',
] as const;

const APPOINTMENT_STATUSES = [
  'Booked',
  'Confirmed',
  'Rescheduled',
  'Cancelled',
  'Draft',
] as const;

const DEFAULT_COLOR = APPOINTMENT_COLORS[0];

// ─── Types ────────────────────────────────────────────────────────────────────

type CalItem = {
  id: string;
  type: 'appointment';
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
  color: string | null;
  status: string | null;
  location: string | null;
  serviceName: string | null;
  customerName: string | null;
  customerEmail: string | null;
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
  | { mode: 'unavail_create'; start: string; end: string }
  | { mode: 'unavail_edit'; item: UnavailItem }
  | null;

type PickerRow = { id: string; label: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDatetimeValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({
  providerOptions,
  serviceOptions,
  selectedProviders,
  selectedServices,
  onToggleProvider,
  onToggleService,
}: {
  providerOptions: PickerRow[];
  serviceOptions: PickerRow[];
  selectedProviders: Set<string>;
  selectedServices: Set<string>;
  onToggleProvider: (id: string) => void;
  onToggleService: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCount = selectedProviders.size + selectedServices.size;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
      >
        <Filter className="h-3.5 w-3.5" aria-hidden />
        Filter
        {activeCount > 0 && (
          <span className="ml-0.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
            {providerOptions.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Providers
                </p>
                <div className="space-y-1">
                  {providerOptions.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProviders.has(p.id)}
                        onChange={() => onToggleProvider(p.id)}
                        className="accent-emerald-500"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {serviceOptions.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Services
                </p>
                <div className="space-y-1">
                  {serviceOptions.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.has(s.id)}
                        onChange={() => onToggleService(s.id)}
                        className="accent-emerald-500"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Add Dropdown ─────────────────────────────────────────────────────────────

function AddDropdown({
  onAddAppointment,
  onAddUnavailability,
}: {
  onAddAppointment: () => void;
  onAddUnavailability: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        aria-label="Add"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddAppointment();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Appointment
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddUnavailability();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Unavailability
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── More Options Dropdown ────────────────────────────────────────────────────

function MoreOptionsDropdown({ onReload }: { onReload: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        aria-label="More options"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReload();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Synchronize
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {APPOINTMENT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="relative h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: c,
            borderColor: value === c ? '#fff' : 'transparent',
            outline: value === c ? '2px solid #10b981' : 'none',
          }}
          aria-label={`Color ${c}`}
        >
          {value === c && (
            <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-zinc-800" strokeWidth={3} aria-hidden />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Calendar Page ───────────────────────────────────────────────────────

export function StaffCalendarPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const calRef = useRef<FullCalendar>(null);

  const [range, setRange] = useState(() => {
    const from = new Date();
    from.setDate(from.getDate() - from.getDay());
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 14);
    return { from, to };
  });

  const [modal, setModal] = useState<ModalState>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

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
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; displayName: string; email: string | null }> }>(
        '/api/staff/team/provider',
      ),
  });

  const servicesQ = useQuery({
    queryKey: ['staff', 'services', 'calendar'],
    queryFn: () =>
      apiJson<{ items: Array<{ id: string; name: string | null }> }>(
        '/api/staff/services?limit=500&offset=0',
      ),
  });

  const customersQ = useQuery({
    queryKey: ['staff', 'customers', 'calendar'],
    queryFn: () =>
      apiJson<{
        items: Array<{
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string | null;
        }>;
      }>('/api/staff/customers?limit=500&offset=0'),
  });

  const providerOptions: PickerRow[] = useMemo(
    () =>
      (providersQ.data?.items ?? []).map((p) => ({
        id: p.id,
        label: p.displayName || p.email || `Provider ${p.id}`,
      })),
    [providersQ.data],
  );

  const serviceOptions: PickerRow[] = useMemo(
    () =>
      (servicesQ.data?.items ?? []).map((s) => ({
        id: s.id,
        label: s.name || `Service ${s.id}`,
      })),
    [servicesQ.data],
  );

  const customerOptions: PickerRow[] = useMemo(
    () =>
      (customersQ.data?.items ?? []).map((c) => {
        const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
        return { id: c.id, label: name || c.email || `Customer ${c.id}` };
      }),
    [customersQ.data],
  );

  const invalidate = useCallback(
    () => void qc.invalidateQueries({ queryKey: ['staff', 'calendar', 'fc', ...rangeKey] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qc, rangeKey.join(',')],
  );

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

  const unavailPatchMut = useMutation({
    mutationFn: (args: { id: string; start: string; end: string }) =>
      apiJson(`/api/staff/calendar/unavailabilities/${args.id}`, {
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
    const typ = arg.event.extendedProps.type as string;
    if (typ === 'appointment') {
      const item = arg.event.extendedProps as CalItem;
      setModal({ mode: 'edit', item: { ...item, id: arg.event.id } });
    } else if (typ === 'unavailability') {
      const u = arg.event.extendedProps as UnavailItem;
      setModal({ mode: 'unavail_edit', item: u });
    }
  }, []);

  const onEventDrop = useCallback(
    (info: EventDropArg) => {
      const typ = info.event.extendedProps.type as string;
      const start = info.event.start;
      const end = info.event.end ?? info.event.start;
      if (!start || !end) {
        info.revert();
        return;
      }
      if (typ === 'appointment') {
        patchApptMut.mutate(
          { id: info.event.id, start: start.toISOString(), end: end.toISOString() },
          { onError: () => info.revert() },
        );
      } else if (typ === 'unavailability') {
        const rawId = info.event.id.replace(/^unavail-/, '');
        unavailPatchMut.mutate(
          { id: rawId, start: start.toISOString(), end: end.toISOString() },
          { onError: () => info.revert() },
        );
      } else {
        info.revert();
      }
    },
    [patchApptMut, unavailPatchMut],
  );

  const onEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      const typ = info.event.extendedProps.type as string;
      const start = info.event.start;
      const end = info.event.end;
      if (!start || !end) {
        info.revert();
        return;
      }
      if (typ === 'appointment') {
        patchApptMut.mutate(
          { id: info.event.id, start: start.toISOString(), end: end.toISOString() },
          { onError: () => info.revert() },
        );
      } else if (typ === 'unavailability') {
        const rawId = info.event.id.replace(/^unavail-/, '');
        unavailPatchMut.mutate(
          { id: rawId, start: start.toISOString(), end: end.toISOString() },
          { onError: () => info.revert() },
        );
      } else {
        info.revert();
      }
    },
    [patchApptMut, unavailPatchMut],
  );

  const appointments = q.data?.items ?? [];
  const blocked = q.data?.blockedPeriods ?? [];
  const unavail = q.data?.unavailabilities ?? [];

  const filteredAppointments = useMemo(() => {
    if (selectedProviders.size === 0 && selectedServices.size === 0) return appointments;
    return appointments.filter((ev) => {
      const providerMatch =
        selectedProviders.size === 0 ||
        (ev.idUsersProvider != null && selectedProviders.has(ev.idUsersProvider));
      const serviceMatch =
        selectedServices.size === 0 ||
        (ev.idServices != null && selectedServices.has(ev.idServices));
      return providerMatch && serviceMatch;
    });
  }, [appointments, selectedProviders, selectedServices]);

  const filteredUnavail = useMemo(() => {
    if (selectedProviders.size === 0) return unavail;
    return unavail.filter(
      (u) => u.idUsersProvider != null && selectedProviders.has(u.idUsersProvider),
    );
  }, [unavail, selectedProviders]);

  const events = [
    ...filteredAppointments.map((ev) => ({
      id: ev.id,
      title: [ev.serviceName, ev.customerName].filter(Boolean).join(' — ') || 'Appointment',
      start: ev.startDatetime ?? undefined,
      end: ev.endDatetime ?? undefined,
      color: ev.color ?? DEFAULT_COLOR,
      editable: true,
      durationEditable: true,
      extendedProps: { ...ev, type: 'appointment' as const },
    })),
    ...blocked.map((b) => ({
      id: `blocked-${b.id}`,
      title: b.name ?? 'Blocked',
      start: b.startDatetime ?? undefined,
      end: b.endDatetime ?? undefined,
      color: '#be2222',
      display: 'background' as const,
      editable: false,
      extendedProps: { ...b, type: 'blocked' as const },
    })),
    ...filteredUnavail.map((u) => ({
      id: `unavail-${u.id}`,
      title: `Unavailable${u.providerName ? ` — ${u.providerName}` : ''}`,
      start: u.startDatetime ?? undefined,
      end: u.endDatetime ?? undefined,
      color: '#bebebe',
      display: 'background' as const,
      editable: true,
      durationEditable: true,
      extendedProps: { ...u, type: 'unavailability' as const },
    })),
  ];

  const toggleProvider = (id: string) =>
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleService = (id: string) =>
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const nowISO = new Date().toISOString();
  const endISO = new Date(Date.now() + 60 * 60_000).toISOString();

  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-50">{t('calendar')}</h1>
          <FilterDropdown
            providerOptions={providerOptions}
            serviceOptions={serviceOptions}
            selectedProviders={selectedProviders}
            selectedServices={selectedServices}
            onToggleProvider={toggleProvider}
            onToggleService={toggleService}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Reload */}
          <button
            type="button"
            onClick={invalidate}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            aria-label="Reload"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </button>

          {/* + Add dropdown */}
          <AddDropdown
            onAddAppointment={() => setModal({ mode: 'create', start: nowISO, end: endISO })}
            onAddUnavailability={() =>
              setModal({ mode: 'unavail_create', start: nowISO, end: endISO })
            }
          />

          {/* More options */}
          <MoreOptionsDropdown onReload={invalidate} />
        </div>
      </div>

      {q.isError && (
        <p className="flex-shrink-0 text-sm text-red-400">{(q.error as Error).message}</p>
      )}

      {/* FullCalendar — fills remaining viewport height */}
      <div className="staff-calendar min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-2">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,today,next',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          selectable
          select={onSelect}
          eventClick={onEventClick}
          events={events}
          height="100%"
          datesSet={onDatesSet}
          editable
          eventDrop={onEventDrop}
          eventResize={onEventResize}
          nowIndicator
          scrollTime="08:00:00"
        />
      </div>

      {/* Appointment modals */}
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

      {/* Unavailability modals */}
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

// ─── Appointment Modal ────────────────────────────────────────────────────────

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
  const [serviceId, setServiceId] = useState(existing?.idServices ?? '');
  const [providerId, setProviderId] = useState(existing?.idUsersProvider ?? '');
  const [color, setColor] = useState(existing?.color ?? DEFAULT_COLOR);
  const [location, setLocation] = useState(existing?.location ?? '');
  const [status, setStatus] = useState(existing?.status ?? 'Booked');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  // Customer section
  const [customerMode, setCustomerMode] = useState<'select' | 'filter'>(
    existing?.idUsersCustomer ? 'select' : 'select',
  );
  const [customerId, setCustomerId] = useState(existing?.idUsersCustomer ?? '');
  const [customerFilter, setCustomerFilter] = useState('');
  const [showCustomerFilter, setShowCustomerFilter] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!customerFilter.trim()) return customerOptions;
    const s = customerFilter.toLowerCase();
    return customerOptions.filter((c) => c.label.toLowerCase().includes(s));
  }, [customerOptions, customerFilter]);

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
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      notes: notes || undefined,
      color: color || undefined,
      status: status || undefined,
      location: location || undefined,
      providerId: providerId || undefined,
      customerId: customerId || undefined,
      serviceId: serviceId || undefined,
    });
  }

  const inputCls =
    'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none';
  const labelCls = 'block space-y-1';
  const spanCls = 'text-xs text-zinc-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            {existing ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-6">
            {/* ── Appointment Details ── */}
            <section>
              <h3 className="mb-4 text-sm font-semibold text-zinc-300">Appointment Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Left column */}
                <div className="space-y-4">
                  <label className={labelCls}>
                    <span className={spanCls}>
                      Service <span className="text-red-400">*</span>
                    </span>
                    <select
                      required
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Select service —</option>
                      {serviceOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>
                      Provider <span className="text-red-400">*</span>
                    </span>
                    <select
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Select provider —</option>
                      {providerOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className={labelCls}>
                    <span className={spanCls}>Color</span>
                    <ColorPicker value={color} onChange={setColor} />
                  </div>

                  <label className={labelCls}>
                    <span className={spanCls}>Location</span>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={inputCls}
                    />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className={inputCls}
                    >
                      {APPOINTMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  <label className={labelCls}>
                    <span className={spanCls}>
                      Start Date / Time <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="datetime-local"
                      required
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className={inputCls}
                    />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>
                      End Date / Time <span className="text-red-400">*</span>
                    </span>
                    <input
                      type="datetime-local"
                      required
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className={inputCls}
                    />
                  </label>

                  <label className={labelCls}>
                    <span className={spanCls}>Notes</span>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={inputCls}
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* ── Customer Details ── */}
            <section className="border-t border-zinc-800 pt-5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-300">Customer</h3>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerId('');
                    setCustomerFilter('');
                    setShowCustomerFilter(false);
                  }}
                  className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  + New
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomerFilter((v) => !v)}
                  className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  Select
                </button>
              </div>

              {showCustomerFilter && (
                <div className="mb-4 space-y-2">
                  <input
                    type="search"
                    placeholder="Type to filter customers…"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className={inputCls}
                  />
                  {filteredCustomers.length > 0 && (
                    <ul className="max-h-40 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950">
                      {filteredCustomers.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerId(c.id);
                              setCustomerFilter(c.label);
                              setShowCustomerFilter(false);
                            }}
                            className={[
                              'w-full px-3 py-2 text-left text-sm hover:bg-zinc-800',
                              customerId === c.id ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-300',
                            ].join(' ')}
                          >
                            {c.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!showCustomerFilter && (
                <label className={labelCls}>
                  <span className={spanCls}>Customer</span>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— None —</option>
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>

            {/* Internal notes (CRM) */}
            {existing && (
              <section className="border-t border-zinc-800 pt-5">
                <AppointmentInternalNotes appointmentId={existing.id} />
              </section>
            )}
          </div>

          {error && (
            <div className="mx-6 mb-4 rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-6 py-4">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 hover:bg-red-950/40"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saveMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Appointment Internal Notes ───────────────────────────────────────────────

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
      apiJson(`/api/staff/calendar/appointments/${appointmentId}/notes/${noteId}`, {
        method: 'DELETE',
      }),
    onSuccess: () =>
      void qc.invalidateQueries({
        queryKey: ['staff', 'calendar', 'appointment-notes', appointmentId],
      }),
  });

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Internal notes (CRM)
      </p>
      {notesQ.isPending && <p className="text-xs text-zinc-500">Loading…</p>}
      {notesQ.isSuccess && notesQ.data.items.length === 0 && (
        <p className="text-xs text-zinc-600">No internal notes yet.</p>
      )}
      {notesQ.isSuccess && notesQ.data.items.length > 0 && (
        <ul className="max-h-40 space-y-2 overflow-y-auto">
          {notesQ.data.items.map((n) => (
            <li
              key={n.id}
              className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-300"
            >
              <div className="mb-1 flex justify-between gap-2 text-[10px] text-zinc-500">
                <span>{n.authorName ?? 'Staff'}</span>
                <span>{n.createDatetime ? new Date(n.createDatetime).toLocaleString() : ''}</span>
              </div>
              <p className="whitespace-pre-wrap">{n.note}</p>
              <button
                type="button"
                onClick={() => delMut.mutate(n.id)}
                disabled={delMut.isPending}
                className="mt-1 text-[10px] text-red-400/80 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add internal note…"
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:outline-none"
        />
        <button
          type="button"
          disabled={addMut.isPending || !draft.trim()}
          onClick={() => addMut.mutate()}
          className="self-end rounded-md border border-zinc-600 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          {addMut.isPending ? '…' : 'Add'}
        </button>
      </div>
    </div>
  );
}

// ─── Unavailability Modal ─────────────────────────────────────────────────────

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
  const [startVal, setStartVal] = useState(() => toLocalDatetimeValue(item?.startDatetime ?? start) || '');
  const [endVal, setEndVal] = useState(() => toLocalDatetimeValue(item?.endDatetime ?? end) || '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const tzDisplay = useMemo(() => {
    const selectedProvider = providerOptions.find((p) => p.id === providerId);
    return selectedProvider?.label ?? '—';
  }, [providerOptions, providerId]);

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
    if (mode === 'create') body.providerId = providerId;
    else if (providerId) body.providerId = providerId;
    saveMut.mutate(body);
  }

  const inputCls =
    'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            {mode === 'create' ? 'New Unavailability' : 'Edit Unavailability'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Provider</span>
            <select
              required={mode === 'create'}
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className={inputCls}
            >
              <option value="">— Select provider —</option>
              {providerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">
              Start <span className="text-red-400">*</span>
            </span>
            <input
              type="datetime-local"
              required
              value={startVal}
              onChange={(e) => setStartVal(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">
              End <span className="text-red-400">*</span>
            </span>
            <input
              type="datetime-local"
              required
              value={endVal}
              onChange={(e) => setEndVal(e.target.value)}
              className={inputCls}
            />
          </label>

          {/* Timezone info */}
          {providerId && (
            <div className="flex items-stretch divide-x divide-zinc-700 overflow-hidden rounded-md border border-zinc-700 bg-zinc-950 text-xs">
              <div className="flex-1 px-3 py-2 text-zinc-400">
                Provider: <span className="text-zinc-300">{tzDisplay}</span>
              </div>
              <div className="flex-1 px-3 py-2 text-zinc-400">
                Current User: <span className="text-zinc-300">Browser</span>
              </div>
            </div>
          )}

          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Notes</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCls}
            />
          </label>

          {error && (
            <p className="rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={() => deleteMut.mutate()}
                disabled={deleteMut.isPending}
                className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saveMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
