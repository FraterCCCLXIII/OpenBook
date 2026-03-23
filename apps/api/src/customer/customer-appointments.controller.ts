import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomerAuthGuard,
  type RequestWithCustomer,
} from '../auth/customer-auth.guard';

@Controller('customer/appointments')
@UseGuards(CustomerAuthGuard)
export class CustomerAppointmentsController {
  constructor(private readonly prisma: PrismaService) {}

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
          [a.provider?.firstName, a.provider?.lastName].filter(Boolean).join(' ').trim() ||
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
      },
    });
    if (!a) {
      throw new NotFoundException();
    }
    return {
      id: a.id.toString(),
      startDatetime: a.startDatetime?.toISOString() ?? null,
      endDatetime: a.endDatetime?.toISOString() ?? null,
      notes: a.notes,
      serviceName: a.service?.name ?? null,
      providerName:
        [a.provider?.firstName, a.provider?.lastName].filter(Boolean).join(' ').trim() ||
        a.provider?.email ||
        null,
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
