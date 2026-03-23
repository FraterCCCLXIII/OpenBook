import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AVAIL_FIXED = 'fixed';

type DayPlan = {
  start: string;
  end: string;
  breaks?: { start: string; end: string }[];
};

type Period = { start: string; end: string };

type BlockEvent = { start: Date; end: Date };

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSetting(name: string): Promise<string | null> {
    const row = await this.prisma.setting.findFirst({ where: { name } });
    return row?.value ?? null;
  }

  async getAvailableHours(params: {
    serviceId: bigint;
    providerId: bigint;
    selectedDate: string;
    excludeAppointmentId?: bigint;
  }): Promise<string[]> {
    const { serviceId, providerId, selectedDate, excludeAppointmentId } =
      params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      throw new BadRequestException('selected_date must be Y-m-d');
    }

    if (await this.isEntireDateBlocked(selectedDate)) {
      return [];
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const provider = await this.prisma.user.findUnique({
      where: { id: providerId },
      include: { userSettings: true },
    });
    if (!provider?.userSettings) {
      throw new NotFoundException('Provider not found');
    }

    // Multi-attendant capacity: slot list still uses single-booking period cuts;
    // registration enforces capacity via overlap count vs attendants_number.

    const periods = await this.getAvailablePeriods({
      date: selectedDate,
      providerId,
      excludeAppointmentId,
      workingPlanJson: provider.userSettings.workingPlan,
      workingPlanExceptionsJson: provider.userSettings.workingPlanExceptions,
    });

    const hours = this.generateAvailableHours(selectedDate, service, periods);
    const withAdvance = await this.considerBookAdvanceTimeout(
      selectedDate,
      hours,
    );
    return this.considerFutureBookingLimit(selectedDate, withAdvance);
  }

  async getUnavailableDates(params: {
    serviceId: bigint;
    providerId: bigint;
    selectedMonth: string;
  }): Promise<{ dates: string[]; isMonthUnavailable: boolean }> {
    const { serviceId, providerId, selectedMonth } = params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedMonth)) {
      throw new BadRequestException('selected_date must be Y-m-d');
    }
    const base = new Date(selectedMonth + 'T12:00:00Z');
    const year = base.getUTCFullYear();
    const month = base.getUTCMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unavailable: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(year, month, d);
      const ymd = formatYmd(cur);
      if (cur < today) {
        unavailable.push(ymd);
        continue;
      }
      const hours = await this.getAvailableHours({
        serviceId,
        providerId,
        selectedDate: ymd,
      });
      if (hours.length === 0) {
        unavailable.push(ymd);
      }
    }

    const isMonthUnavailable = unavailable.length === daysInMonth;
    return { dates: isMonthUnavailable ? [] : unavailable, isMonthUnavailable };
  }

  private async isEntireDateBlocked(date: string): Promise<boolean> {
    const rows = await this.prisma.blockedPeriod.count({
      where: {
        startDatetime: { lte: dayEnd(date) },
        endDatetime: { gte: dayStart(date) },
      },
    });
    return rows > 0;
  }

  private async getAvailablePeriods(params: {
    date: string;
    providerId: bigint;
    excludeAppointmentId?: bigint;
    workingPlanJson: string | null;
    workingPlanExceptionsJson: string | null;
  }): Promise<Period[]> {
    const {
      date,
      providerId,
      excludeAppointmentId,
      workingPlanJson,
      workingPlanExceptionsJson,
    } = params;

    const workingPlan =
      parseJsonRecord<Record<string, DayPlan>>(workingPlanJson);
    const exceptions = parseJsonRecord<Record<string, DayPlan>>(
      workingPlanExceptionsJson,
    );

    const appts = await this.prisma.appointment.findMany({
      where: {
        idUsersProvider: providerId,
        startDatetime: { not: null },
        endDatetime: { not: null },
        AND: [
          { startDatetime: { lte: dayEnd(date) } },
          { endDatetime: { gte: dayStart(date) } },
        ],
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    });

    const blockedRows = await this.prisma.blockedPeriod.findMany({
      where: {
        OR: [
          {
            AND: [
              { startDatetime: { lte: dayStart(date) } },
              { endDatetime: { gte: dayEnd(date) } },
            ],
          },
          {
            AND: [
              { startDatetime: { gte: dayStart(date) } },
              { endDatetime: { lte: dayEnd(date) } },
            ],
          },
          {
            AND: [
              { endDatetime: { gt: dayStart(date) } },
              { endDatetime: { lt: dayEnd(date) } },
            ],
          },
          {
            AND: [
              { startDatetime: { gt: dayStart(date) } },
              { startDatetime: { lt: dayEnd(date) } },
            ],
          },
        ],
      },
    });

    const workingDay = weekdayKey(date);
    let datePlan = workingPlan[workingDay] ?? null;
    if (exceptions && Object.prototype.hasOwnProperty.call(exceptions, date)) {
      datePlan = exceptions[date]!;
    }
    if (!datePlan) {
      return [];
    }

    let periods: Period[] = [{ start: datePlan.start, end: datePlan.end }];
    for (const br of datePlan.breaks ?? []) {
      const next: Period[] = [];
      for (const p of periods) {
        next.push(
          ...subtractIntervalFromPeriod(
            date,
            p,
            timeOnDate(date, br.start),
            timeOnDate(date, br.end),
          ),
        );
      }
      periods = next;
    }

    const events: BlockEvent[] = [
      ...appts
        .filter((a) => a.startDatetime && a.endDatetime)
        .map((a) => ({ start: a.startDatetime!, end: a.endDatetime! })),
      ...blockedRows
        .filter((b) => b.startDatetime && b.endDatetime)
        .map((b) => ({ start: b.startDatetime!, end: b.endDatetime! })),
    ];

    for (const ev of events) {
      const next: Period[] = [];
      for (const p of periods) {
        next.push(...subtractIntervalFromPeriod(date, p, ev.start, ev.end));
      }
      periods = next;
    }

    return periods.filter((p) => p.start < p.end);
  }

  private generateAvailableHours(
    date: string,
    service: { duration: number | null; availabilitiesType: string | null },
    emptyPeriods: Period[],
  ): string[] {
    const available: string[] = [];
    const duration = service.duration ?? 30;
    const interval = service.availabilitiesType === AVAIL_FIXED ? duration : 15;

    for (const period of emptyPeriods) {
      let current = timeOnDate(date, period.start);
      const endLimit = timeOnDate(date, period.end);
      const durationMs = duration * 60 * 1000;
      const intervalMs = interval * 60 * 1000;

      while (endLimit.getTime() - current.getTime() >= durationMs) {
        available.push(formatHm(current));
        current = new Date(current.getTime() + intervalMs);
      }
    }
    return [...new Set(available)].sort();
  }

  private async considerBookAdvanceTimeout(
    date: string,
    hours: string[],
  ): Promise<string[]> {
    const raw = (await this.getSetting('book_advance_timeout')) ?? '30';
    const minutes = Number.parseInt(raw, 10) || 0;
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() + minutes);
    const today = formatYmd(new Date());
    if (date > today) {
      return [...hours].sort();
    }
    if (date < today) {
      return [];
    }
    const out: string[] = [];
    for (const hm of hours) {
      const slot = parseSlotLocal(date, hm);
      if (slot.getTime() > threshold.getTime()) {
        out.push(hm);
      }
    }
    return out.sort();
  }

  private async considerFutureBookingLimit(
    date: string,
    hours: string[],
  ): Promise<string[]> {
    const raw = (await this.getSetting('future_booking_limit')) ?? '365';
    const days = Number.parseInt(raw, 10) || 365;
    const limit = new Date();
    limit.setHours(23, 59, 59, 999);
    limit.setDate(limit.getDate() + days);
    const sel = new Date(date + 'T12:00:00');
    if (sel > limit) {
      return [];
    }
    return hours;
  }
}

function parseJsonRecord<T>(raw: string | null | undefined): T {
  if (!raw) {
    return {} as T;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

function weekdayKey(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00Z');
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[d.getUTCDay()] ?? 'monday';
}

function dayStart(isoDate: string): Date {
  return new Date(isoDate + 'T00:00:00.000Z');
}

function dayEnd(isoDate: string): Date {
  return new Date(isoDate + 'T23:59:59.999Z');
}

function formatYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function timeOnDate(date: string, hm: string): Date {
  const [h, m] = hm.split(':').map((x) => Number.parseInt(x, 10));
  const d = new Date(date + 'T00:00:00');
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function formatHm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseSlotLocal(date: string, hm: string): Date {
  const [h, m] = hm.split(':').map((x) => Number.parseInt(x, 10));
  const d = new Date(date + 'T00:00:00');
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function subtractIntervalFromPeriod(
  date: string,
  period: Period,
  intervalStart: Date,
  intervalEnd: Date,
): Period[] {
  const periodStart = timeOnDate(date, period.start);
  const periodEnd = timeOnDate(date, period.end);
  if (intervalStart >= intervalEnd) {
    return [period];
  }
  if (intervalEnd <= periodStart || intervalStart >= periodEnd) {
    return [period];
  }

  const out: Period[] = [];
  if (intervalStart > periodStart) {
    out.push({ start: formatHm(periodStart), end: formatHm(intervalStart) });
  }
  if (intervalEnd < periodEnd) {
    out.push({ start: formatHm(intervalEnd), end: formatHm(periodEnd) });
  }
  return out.filter((p) => p.start < p.end);
}
