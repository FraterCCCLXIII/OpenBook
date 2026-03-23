import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';

@Controller('staff/calendar')
@UseGuards(StaffAuthGuard)
export class StaffCalendarController {
  constructor(private readonly prisma: PrismaService) {}

  /** Appointments in a time window (FullCalendar / list views). */
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

    const rows = await this.prisma.appointment.findMany({
      where: {
        isUnavailability: 0,
        startDatetime: { gte: from, lte: to },
      },
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
    });

    return {
      items: rows.map((a) => ({
        id: a.id.toString(),
        startDatetime: a.startDatetime?.toISOString() ?? null,
        endDatetime: a.endDatetime?.toISOString() ?? null,
        notes: a.notes,
        serviceName: a.service?.name ?? null,
        customerName:
          [a.customer?.firstName, a.customer?.lastName].filter(Boolean).join(' ').trim() ||
          a.customer?.email ||
          null,
        providerName:
          [a.provider?.firstName, a.provider?.lastName].filter(Boolean).join(' ').trim() ||
          a.provider?.email ||
          null,
      })),
    };
  }
}
