import { useCallback, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg } from '@fullcalendar/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiJson } from '../../lib/api';

type CalItem = {
  id: string;
  startDatetime: string | null;
  endDatetime: string | null;
  serviceName: string | null;
  customerName: string | null;
};

export function StaffCalendarPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState(() => {
    const from = new Date();
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);
    return { from, to };
  });

  const q = useQuery({
    queryKey: ['staff', 'calendar', 'fc', range.from.toISOString(), range.to.toISOString()],
    queryFn: () =>
      apiJson<{ items: CalItem[] }>(
        `/api/staff/calendar/appointments?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`,
      ),
  });

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({ from: arg.start, to: arg.end });
  }, []);

  const events = (q.data?.items ?? []).map((ev) => ({
    id: ev.id,
    title: [ev.serviceName, ev.customerName].filter(Boolean).join(' — ') || 'Appointment',
    start: ev.startDatetime ?? undefined,
    end: ev.endDatetime ?? undefined,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">{t('calendar')}</h1>
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      <div className="staff-calendar fc-theme-standard min-h-[520px] rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 [&_.fc-toolbar-title]:text-zinc-100 [&_.fc-button]:border-zinc-600 [&_.fc-button]:bg-zinc-800 [&_.fc-button]:text-zinc-200">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          events={events}
          height="auto"
          datesSet={onDatesSet}
        />
      </div>
    </div>
  );
}
