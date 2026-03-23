import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { JobsQueueService } from '../jobs/jobs-queue.service';
import { BookingCatalogService } from './booking-catalog.service';

function normalizeHm(hm: string): string {
  const parts = hm.trim().split(':');
  const h = Number.parseInt(parts[0] ?? '0', 10);
  const m = Number.parseInt(parts[1] ?? '0', 10);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${pad(Math.min(23, Math.max(0, h)))}:${pad(Math.min(59, Math.max(0, m)))}`;
}

function parseSlotToDate(ymd: string, hm: string): Date {
  const n = normalizeHm(hm);
  const [h, mi] = n.split(':').map((x) => Number.parseInt(x, 10));
  const d = new Date(ymd + 'T00:00:00');
  d.setHours(h || 0, mi || 0, 0, 0);
  return d;
}

@Injectable()
export class BookingRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly catalog: BookingCatalogService,
    private readonly jobs: JobsQueueService,
  ) {}

  async createGuestAppointment(input: {
    serviceId: bigint;
    providerId: bigint;
    selectedDate: string;
    startTimeHm: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
  }) {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.firstName?.trim() || !input.lastName?.trim()) {
      throw new BadRequestException('first_name, last_name, and email are required');
    }

    await this.catalog.assertProviderOffersService(
      input.serviceId,
      input.providerId,
    );

    const slot = normalizeHm(input.startTimeHm);
    const hours = await this.availability.getAvailableHours({
      serviceId: input.serviceId,
      providerId: input.providerId,
      selectedDate: input.selectedDate,
    });
    if (!hours.includes(slot)) {
      throw new BadRequestException('Selected time is not available');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: input.serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const durationMin = service.duration ?? 30;
    const start = parseSlotToDate(input.selectedDate, slot);
    const end = new Date(start.getTime() + durationMin * 60 * 1000);

    const capacity = service.attendantsNumber ?? 1;
    const overlap = await this.prisma.appointment.count({
      where: {
        idUsersProvider: input.providerId,
        isUnavailability: 0,
        startDatetime: { not: null },
        endDatetime: { not: null },
        AND: [
          { startDatetime: { lt: end } },
          { endDatetime: { gt: start } },
        ],
      },
    });
    if (overlap >= capacity) {
      throw new BadRequestException('That slot was just taken — pick another time');
    }

    const guestLines = [
      `Guest: ${input.firstName.trim()} ${input.lastName.trim()}`,
      `Email: ${email}`,
      input.phone?.trim() ? `Phone: ${input.phone.trim()}` : null,
      input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const hash = randomBytes(16).toString('hex');

    const created = await this.prisma.appointment.create({
      data: {
        bookDatetime: start,
        startDatetime: start,
        endDatetime: end,
        notes: guestLines,
        hash,
        isUnavailability: 0,
        idUsersProvider: input.providerId,
        idServices: input.serviceId,
        idUsersCustomer: null,
      },
    });

    await this.jobs.enqueueBookingConfirmation(created.id.toString());

    return {
      id: created.id.toString(),
      hash: created.hash,
      startDatetime: created.startDatetime?.toISOString() ?? null,
      endDatetime: created.endDatetime?.toISOString() ?? null,
    };
  }
}
