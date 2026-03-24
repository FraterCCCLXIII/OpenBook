import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { JobsQueueService } from '../jobs/jobs-queue.service';
import { SettingsService } from '../settings/settings.service';
import { BookingCatalogService } from './booking-catalog.service';

async function verifyTurnstileToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.OPENBOOK_TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (!token?.trim()) return false;
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    },
  );
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

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
    private readonly settings: SettingsService,
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
    address?: string;
    city?: string;
    zip_code?: string;
    captcha_token?: string;
    custom_fields?: Record<string, string>;
  }) {
    const email = input.email.trim().toLowerCase();
    const policy = await this.settings.getSettingsByNames([
      'require_captcha',
      'require_phone_number',
      'require_notes',
      'require_first_name',
      'require_last_name',
      'require_address',
    ]);

    if (policy.require_captcha === '1') {
      const ok = await verifyTurnstileToken(input.captcha_token);
      if (!ok) {
        throw new BadRequestException('CAPTCHA verification failed');
      }
    }

    if (!email) {
      throw new BadRequestException('email is required');
    }
    if (policy.require_first_name !== '0' && !input.firstName?.trim()) {
      throw new BadRequestException('first_name is required');
    }
    if (policy.require_last_name !== '0' && !input.lastName?.trim()) {
      throw new BadRequestException('last_name is required');
    }
    if (policy.require_phone_number === '1' && !input.phone?.trim()) {
      throw new BadRequestException('phone is required');
    }
    if (policy.require_notes === '1' && !input.notes?.trim()) {
      throw new BadRequestException('notes is required');
    }
    if (policy.require_address === '1' && !input.address?.trim()) {
      throw new BadRequestException('address is required');
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
        AND: [{ startDatetime: { lt: end } }, { endDatetime: { gt: start } }],
      },
    });
    if (overlap >= capacity) {
      throw new BadRequestException(
        'That slot was just taken — pick another time',
      );
    }

    const customParts: string[] = [];
    if (input.custom_fields) {
      for (const [fid, val] of Object.entries(input.custom_fields)) {
        if (val?.trim()) {
          customParts.push(`custom_field_${fid}: ${val.trim()}`);
        }
      }
    }

    const guestLines = [
      `Guest: ${input.firstName.trim()} ${input.lastName.trim()}`,
      `Email: ${email}`,
      input.phone?.trim() ? `Phone: ${input.phone.trim()}` : null,
      input.address?.trim() ? `Address: ${input.address.trim()}` : null,
      input.city?.trim() ? `City: ${input.city.trim()}` : null,
      input.zip_code?.trim() ? `ZIP: ${input.zip_code.trim()}` : null,
      input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null,
      customParts.length ? customParts.join('\n') : null,
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
