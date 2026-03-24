import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomerAuthGuard,
  type RequestWithCustomer,
} from '../auth/customer-auth.guard';
import { AvailabilityService } from '../availability/availability.service';
import { JobsQueueService } from '../jobs/jobs-queue.service';

@Controller('customer/appointments')
@UseGuards(CustomerAuthGuard)
export class CustomerAppointmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly queue: JobsQueueService,
  ) {}

  @Post()
  async create(
    @Req() req: RequestWithCustomer,
    @Body()
    body: {
      serviceId?: string;
      providerId?: string;
      startDatetime?: string;
      notes?: string;
    },
  ) {
    if (!body.serviceId || !body.providerId || !body.startDatetime) {
      throw new BadRequestException(
        'serviceId, providerId, startDatetime are required',
      );
    }

    const serviceId = BigInt(body.serviceId);
    const providerId = BigInt(body.providerId);
    const customerId = BigInt(req.customerUser.customerId);

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const startDatetime = new Date(body.startDatetime);
    if (isNaN(startDatetime.getTime())) {
      throw new BadRequestException('Invalid startDatetime');
    }

    const selectedDate = startDatetime.toISOString().slice(0, 10);
    const slots = await this.availability.getAvailableHours({
      serviceId,
      providerId,
      selectedDate,
    });
    const startTime = startDatetime.toTimeString().slice(0, 5);
    if (!slots.includes(startTime)) {
      throw new BadRequestException('The selected time slot is not available');
    }

    const duration = service.duration ?? 30;
    const endDatetime = new Date(startDatetime.getTime() + duration * 60_000);

    const capacity = service.attendantsNumber ?? 1;
    const overlap = await this.prisma.appointment.count({
      where: {
        idUsersProvider: providerId,
        isUnavailability: 0,
        startDatetime: { not: null },
        endDatetime: { not: null },
        AND: [
          { startDatetime: { lt: endDatetime } },
          { endDatetime: { gt: startDatetime } },
        ],
      },
    });
    if (overlap >= capacity) {
      throw new BadRequestException(
        'That slot is full — pick another time or provider',
      );
    }

    const appt = await this.prisma.appointment.create({
      data: {
        startDatetime,
        endDatetime,
        notes: body.notes ?? null,
        idUsersProvider: providerId,
        idUsersCustomer: customerId,
        idServices: serviceId,
        isUnavailability: 0,
        hash: Math.random().toString(36).slice(2),
      },
    });

    await this.queue.enqueueBookingConfirmation(appt.id.toString());

    return { id: appt.id.toString(), ok: true };
  }

  @Get()
  async list(@Req() req: RequestWithCustomer) {
    const customerId = BigInt(req.customerUser.customerId);
    const rows = await this.prisma.appointment.findMany({
      where: {
        idUsersCustomer: customerId,
        isUnavailability: 0,
      },
      orderBy: { startDatetime: 'desc' },
      take: 100,
      include: {
        service: true,
        provider: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return {
      items: rows.map((a) => ({
        id: a.id.toString(),
        startDatetime: a.startDatetime?.toISOString() ?? null,
        endDatetime: a.endDatetime?.toISOString() ?? null,
        notes: a.notes,
        serviceName: a.service?.name ?? null,
        providerName:
          [a.provider?.firstName, a.provider?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          a.provider?.email ||
          null,
      })),
    };
  }

  @Get(':id')
  async one(@Req() req: RequestWithCustomer, @Param('id') id: string) {
    const customerId = BigInt(req.customerUser.customerId);
    let apptId: bigint;
    try {
      apptId = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const a = await this.prisma.appointment.findFirst({
      where: { id: apptId, idUsersCustomer: customerId, isUnavailability: 0 },
      include: {
        service: true,
        provider: {
          select: { firstName: true, lastName: true, email: true },
        },
        payments: { orderBy: { id: 'desc' }, take: 1 },
      },
    });
    if (!a) {
      throw new NotFoundException();
    }
    const latest = a.payments[0];
    const price = a.service?.price;
    const hasPrice = price != null && Number(price) > 0;
    const paid =
      latest?.status === 'succeeded' ||
      latest?.status === 'partially_refunded';
    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
    return {
      id: a.id.toString(),
      startDatetime: a.startDatetime?.toISOString() ?? null,
      endDatetime: a.endDatetime?.toISOString() ?? null,
      notes: a.notes,
      serviceName: a.service?.name ?? null,
      providerName:
        [a.provider?.firstName, a.provider?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        a.provider?.email ||
        null,
      servicePrice: price?.toString() ?? null,
      serviceCurrency: a.service?.currency ?? null,
      latestPayment: latest
        ? {
            status: latest.status,
            amount: latest.amount?.toString() ?? null,
            currency: latest.currency,
          }
        : null,
      canPayWithStripe: stripeConfigured && hasPrice && !paid,
    };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithCustomer,
    @Param('id') id: string,
    @Body() body: { startDatetime?: string; notes?: string },
  ) {
    const customerId = BigInt(req.customerUser.customerId);
    let apptId: bigint;
    try {
      apptId = BigInt(id);
    } catch {
      throw new NotFoundException();
    }

    const existing = await this.prisma.appointment.findFirst({
      where: { id: apptId, idUsersCustomer: customerId, isUnavailability: 0 },
      include: { service: true },
    });
    if (!existing) throw new NotFoundException();

    const updateData: {
      notes?: string | null;
      startDatetime?: Date;
      endDatetime?: Date;
    } = {};

    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }

    if (body.startDatetime !== undefined) {
      const startDatetime = new Date(body.startDatetime);
      if (isNaN(startDatetime.getTime())) {
        throw new BadRequestException('Invalid startDatetime');
      }

      if (existing.idServices && existing.idUsersProvider) {
        const selectedDate = startDatetime.toISOString().slice(0, 10);
        const slots = await this.availability.getAvailableHours({
          serviceId: existing.idServices,
          providerId: existing.idUsersProvider,
          selectedDate,
          excludeAppointmentId: apptId,
        });
        const startTime = startDatetime.toTimeString().slice(0, 5);
        if (!slots.includes(startTime)) {
          throw new BadRequestException(
            'The selected time slot is not available',
          );
        }
      }

      const duration = existing.service?.duration ?? 30;
      updateData.startDatetime = startDatetime;
      updateData.endDatetime = new Date(
        startDatetime.getTime() + duration * 60_000,
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id: apptId },
      data: updateData,
      include: {
        service: true,
        provider: { select: { firstName: true, lastName: true, email: true } },
        payments: { orderBy: { id: 'desc' }, take: 1 },
      },
    });

    const latest = updated.payments[0];
    const price = updated.service?.price;
    const hasPrice = price != null && Number(price) > 0;
    const paid =
      latest?.status === 'succeeded' ||
      latest?.status === 'partially_refunded';
    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

    return {
      id: updated.id.toString(),
      startDatetime: updated.startDatetime?.toISOString() ?? null,
      endDatetime: updated.endDatetime?.toISOString() ?? null,
      notes: updated.notes,
      serviceName: updated.service?.name ?? null,
      providerName:
        [updated.provider?.firstName, updated.provider?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        updated.provider?.email ||
        null,
      servicePrice: price?.toString() ?? null,
      serviceCurrency: updated.service?.currency ?? null,
      latestPayment: latest
        ? {
            status: latest.status,
            amount: latest.amount?.toString() ?? null,
            currency: latest.currency,
          }
        : null,
      canPayWithStripe: stripeConfigured && hasPrice && !paid,
    };
  }

  @Delete(':id')
  async cancel(@Req() req: RequestWithCustomer, @Param('id') id: string) {
    const customerId = BigInt(req.customerUser.customerId);
    let apptId: bigint;
    try {
      apptId = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const deleted = await this.prisma.appointment.deleteMany({
      where: { id: apptId, idUsersCustomer: customerId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException();
    }
    return { ok: true };
  }
}
