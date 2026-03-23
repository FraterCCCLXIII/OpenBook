import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';

@Controller('staff/provider/bookings')
@UseGuards(StaffAuthGuard)
export class StaffProviderBookingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: RequestWithStaff) {
    if (req.staffUser.roleSlug !== 'provider') {
      throw new ForbiddenException();
    }
    if (!canView(req.staffUser.permissions, 'appointments')) {
      throw new ForbiddenException();
    }

    const providerId = BigInt(req.staffUser.userId);
    const rows = await this.prisma.appointment.findMany({
      where: {
        idUsersProvider: providerId,
        isUnavailability: 0,
      },
      orderBy: { startDatetime: 'desc' },
      take: 100,
      include: {
        service: true,
        customer: {
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
        customerName:
          [a.customer?.firstName, a.customer?.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          a.customer?.email ||
          null,
      })),
    };
  }

  @Get(':id')
  async one(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (req.staffUser.roleSlug !== 'provider') {
      throw new ForbiddenException();
    }
    if (!canView(req.staffUser.permissions, 'appointments')) {
      throw new ForbiddenException();
    }
    let apptId: bigint;
    try {
      apptId = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const providerId = BigInt(req.staffUser.userId);
    const a = await this.prisma.appointment.findFirst({
      where: {
        id: apptId,
        idUsersProvider: providerId,
        isUnavailability: 0,
      },
      include: {
        service: true,
        customer: {
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
      customerName:
        [a.customer?.firstName, a.customer?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        a.customer?.email ||
        null,
    };
  }
}
