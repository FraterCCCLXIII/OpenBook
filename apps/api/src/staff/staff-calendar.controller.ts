import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';
import { JobsQueueService } from '../jobs/jobs-queue.service';

@Controller('staff/calendar')
@UseGuards(StaffAuthGuard)
export class StaffCalendarController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsQueueService,
  ) {}

  // ─── Appointments ──────────────────────────────────────────────────────────

  @Get('appointments')
  async list(
    @Req() req: RequestWithStaff,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    if (!canView(req.staffUser.permissions, 'appointments')) {
      throw new ForbiddenException();
    }
    const from = fromStr ? new Date(fromStr) : new Date();
    const to = toStr
      ? new Date(toStr)
      : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [appointments, blocked, unavailabilities] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { isUnavailability: 0, startDatetime: { gte: from, lte: to } },
        orderBy: { startDatetime: 'asc' },
        include: {
          service: true,
          customer: {
            select: { firstName: true, lastName: true, email: true },
          },
          provider: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.blockedPeriod.findMany({
        where: { startDatetime: { gte: from, lte: to } },
        orderBy: { startDatetime: 'asc' },
      }),
      this.prisma.appointment.findMany({
        where: { isUnavailability: 1, startDatetime: { gte: from, lte: to } },
        orderBy: { startDatetime: 'asc' },
        include: { provider: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    return {
      items: appointments.map((a) => ({
        id: a.id.toString(),
        type: 'appointment',
        startDatetime: a.startDatetime?.toISOString() ?? null,
        endDatetime: a.endDatetime?.toISOString() ?? null,
        notes: a.notes,
        serviceName: a.service?.name ?? null,
        customerName:
          [a.customer?.firstName, a.customer?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          a.customer?.email ||
          null,
        providerName:
          [a.provider?.firstName, a.provider?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          a.provider?.email ||
          null,
        idUsersProvider: a.idUsersProvider?.toString() ?? null,
        idUsersCustomer: a.idUsersCustomer?.toString() ?? null,
        idServices: a.idServices?.toString() ?? null,
      })),
      blockedPeriods: blocked.map((b) => ({
        id: b.id,
        type: 'blocked',
        name: b.name,
        startDatetime: b.startDatetime?.toISOString() ?? null,
        endDatetime: b.endDatetime?.toISOString() ?? null,
        notes: b.notes,
      })),
      unavailabilities: unavailabilities.map((u) => ({
        id: u.id.toString(),
        type: 'unavailability',
        startDatetime: u.startDatetime?.toISOString() ?? null,
        endDatetime: u.endDatetime?.toISOString() ?? null,
        notes: u.notes,
        providerName:
          [u.provider?.firstName, u.provider?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() || null,
        idUsersProvider: u.idUsersProvider?.toString() ?? null,
      })),
    };
  }

  @Post('appointments')
  async create(
    @Req() req: RequestWithStaff,
    @Body()
    body: {
      start?: string;
      end?: string;
      providerId?: string;
      customerId?: string;
      serviceId?: string;
      notes?: string;
    },
  ) {
    if (!can(req.staffUser.permissions, 'appointments', 'add')) {
      throw new ForbiddenException();
    }
    if (!body.start || !body.end) {
      throw new BadRequestException('start and end are required');
    }
    const row = await this.prisma.appointment.create({
      data: {
        bookDatetime: new Date(),
        startDatetime: new Date(body.start),
        endDatetime: new Date(body.end),
        notes: body.notes ?? null,
        isUnavailability: 0,
        idUsersProvider: body.providerId ? BigInt(body.providerId) : null,
        idUsersCustomer: body.customerId ? BigInt(body.customerId) : null,
        idServices: body.serviceId ? BigInt(body.serviceId) : null,
      },
    });
    void this.jobs.enqueueWebhookDispatch({
      event: 'appointment.created',
      appointmentId: row.id.toString(),
    });
    return { id: row.id.toString(), ok: true };
  }

  @Patch('appointments/:id')
  async update(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body()
    body: {
      start?: string;
      end?: string;
      notes?: string;
      providerId?: string;
      customerId?: string;
      serviceId?: string;
    },
  ) {
    if (!can(req.staffUser.permissions, 'appointments', 'edit')) {
      throw new ForbiddenException();
    }
    let bid: bigint;
    try {
      bid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.appointment.findFirst({
      where: { id: bid, isUnavailability: 0 },
    });
    if (!existing) throw new NotFoundException();
    await this.prisma.appointment.update({
      where: { id: bid },
      data: {
        ...(body.start !== undefined
          ? { startDatetime: new Date(body.start) }
          : {}),
        ...(body.end !== undefined ? { endDatetime: new Date(body.end) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.providerId !== undefined
          ? { idUsersProvider: BigInt(body.providerId) }
          : {}),
        ...(body.customerId !== undefined
          ? { idUsersCustomer: BigInt(body.customerId) }
          : {}),
        ...(body.serviceId !== undefined
          ? { idServices: BigInt(body.serviceId) }
          : {}),
      },
    });
    void this.jobs.enqueueWebhookDispatch({
      event: 'appointment.updated',
      appointmentId: bid.toString(),
    });
    return { ok: true };
  }

  @Delete('appointments/:id')
  async remove(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!can(req.staffUser.permissions, 'appointments', 'delete')) {
      throw new ForbiddenException();
    }
    let bid: bigint;
    try {
      bid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    void this.jobs.enqueueWebhookDispatch({
      event: 'appointment.deleted',
      appointmentId: bid.toString(),
    });
    await this.prisma.appointment.deleteMany({
      where: { id: bid, isUnavailability: 0 },
    });
    return { ok: true };
  }

  // ─── Blocked periods ───────────────────────────────────────────────────────

  @Get('blocked-periods')
  async listBlockedPeriods(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'blocked_periods')) {
      throw new ForbiddenException();
    }
    const rows = await this.prisma.blockedPeriod.findMany({
      orderBy: { startDatetime: 'asc' },
    });
    return { items: rows.map(mapBlockedPeriod) };
  }

  @Post('blocked-periods')
  async createBlockedPeriod(
    @Req() req: RequestWithStaff,
    @Body()
    body: { name?: string; start?: string; end?: string; notes?: string },
  ) {
    if (!can(req.staffUser.permissions, 'blocked_periods', 'add')) {
      throw new ForbiddenException();
    }
    if (!body.start || !body.end)
      throw new BadRequestException('start and end are required');
    const now = new Date();
    const row = await this.prisma.blockedPeriod.create({
      data: {
        name: body.name ?? null,
        startDatetime: new Date(body.start),
        endDatetime: new Date(body.end),
        notes: body.notes ?? null,
        createDatetime: now,
        updateDatetime: now,
      },
    });
    return mapBlockedPeriod(row);
  }

  @Patch('blocked-periods/:id')
  async updateBlockedPeriod(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body()
    body: { name?: string; start?: string; end?: string; notes?: string },
  ) {
    if (!can(req.staffUser.permissions, 'blocked_periods', 'edit')) {
      throw new ForbiddenException();
    }
    const existing = await this.prisma.blockedPeriod.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.blockedPeriod.update({
      where: { id: Number(id) },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.start !== undefined
          ? { startDatetime: new Date(body.start) }
          : {}),
        ...(body.end !== undefined ? { endDatetime: new Date(body.end) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        updateDatetime: new Date(),
      },
    });
    return mapBlockedPeriod(row);
  }

  @Delete('blocked-periods/:id')
  async removeBlockedPeriod(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
  ) {
    if (!can(req.staffUser.permissions, 'blocked_periods', 'delete')) {
      throw new ForbiddenException();
    }
    await this.prisma.blockedPeriod.deleteMany({ where: { id: Number(id) } });
    return { ok: true };
  }

  // ─── Unavailabilities ──────────────────────────────────────────────────────

  @Get('unavailabilities')
  async listUnavailabilities(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'appointments')) {
      throw new ForbiddenException();
    }
    const rows = await this.prisma.appointment.findMany({
      where: { isUnavailability: 1 },
      orderBy: { startDatetime: 'asc' },
      include: { provider: { select: { firstName: true, lastName: true } } },
    });
    return {
      items: rows.map((u) => ({
        id: u.id.toString(),
        startDatetime: u.startDatetime?.toISOString() ?? null,
        endDatetime: u.endDatetime?.toISOString() ?? null,
        notes: u.notes,
        providerName:
          [u.provider?.firstName, u.provider?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() || null,
        idUsersProvider: u.idUsersProvider?.toString() ?? null,
      })),
    };
  }

  @Post('unavailabilities')
  async createUnavailability(
    @Req() req: RequestWithStaff,
    @Body()
    body: { start?: string; end?: string; providerId?: string; notes?: string },
  ) {
    if (!can(req.staffUser.permissions, 'appointments', 'add')) {
      throw new ForbiddenException();
    }
    if (!body.start || !body.end || !body.providerId) {
      throw new BadRequestException('start, end and providerId are required');
    }
    const row = await this.prisma.appointment.create({
      data: {
        bookDatetime: new Date(),
        startDatetime: new Date(body.start),
        endDatetime: new Date(body.end),
        notes: body.notes ?? null,
        isUnavailability: 1,
        idUsersProvider: BigInt(body.providerId),
      },
    });
    return { id: row.id.toString(), ok: true };
  }

  @Patch('unavailabilities/:id')
  async updateUnavailability(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body()
    body: { start?: string; end?: string; providerId?: string; notes?: string },
  ) {
    if (!can(req.staffUser.permissions, 'appointments', 'edit')) {
      throw new ForbiddenException();
    }
    let bid: bigint;
    try {
      bid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.appointment.findFirst({
      where: { id: bid, isUnavailability: 1 },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.appointment.update({
      where: { id: bid },
      data: {
        ...(body.start ? { startDatetime: new Date(body.start) } : {}),
        ...(body.end ? { endDatetime: new Date(body.end) } : {}),
        ...(body.providerId
          ? { idUsersProvider: BigInt(body.providerId) }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
    });
    return {
      id: row.id.toString(),
      startDatetime: row.startDatetime?.toISOString() ?? null,
      endDatetime: row.endDatetime?.toISOString() ?? null,
      notes: row.notes,
    };
  }

  @Delete('unavailabilities/:id')
  async removeUnavailability(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
  ) {
    if (!can(req.staffUser.permissions, 'appointments', 'delete')) {
      throw new ForbiddenException();
    }
    let bid: bigint;
    try {
      bid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    await this.prisma.appointment.deleteMany({
      where: { id: bid, isUnavailability: 1 },
    });
    return { ok: true };
  }
}

function mapBlockedPeriod(b: {
  id: number;
  name: string | null;
  startDatetime: Date | null;
  endDatetime: Date | null;
  notes: string | null;
}) {
  return {
    id: b.id,
    name: b.name,
    start: b.startDatetime?.toISOString() ?? null,
    end: b.endDatetime?.toISOString() ?? null,
    notes: b.notes,
  };
}
