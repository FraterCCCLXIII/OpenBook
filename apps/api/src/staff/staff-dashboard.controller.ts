import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';

@Controller('staff/dashboard')
@UseGuards(StaffAuthGuard)
export class StaffDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'appointments')) {
      throw new ForbiddenException();
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const next7End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });

    const [todayCount, upcomingCount, totalCustomers, recentAppointments] =
      await Promise.all([
        this.prisma.appointment.count({
          where: {
            isUnavailability: 0,
            startDatetime: { gte: todayStart, lte: todayEnd },
          },
        }),
        this.prisma.appointment.count({
          where: {
            isUnavailability: 0,
            startDatetime: { gte: now, lte: next7End },
          },
        }),
        customerRole
          ? this.prisma.user.count({ where: { idRoles: customerRole.id } })
          : 0,
        this.prisma.appointment.findMany({
          where: {
            isUnavailability: 0,
            startDatetime: { gte: now },
          },
          take: 5,
          orderBy: { startDatetime: 'asc' },
          include: {
            service: true,
            customer: {
              select: { firstName: true, lastName: true, email: true },
            },
            provider: { select: { firstName: true, lastName: true } },
          },
        }),
      ]);

    return {
      todayAppointments: todayCount,
      upcomingAppointments: upcomingCount,
      totalCustomers,
      recentAppointments: recentAppointments.map((a) => ({
        id: a.id.toString(),
        startDatetime: a.startDatetime?.toISOString() ?? null,
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
            .trim() || null,
      })),
    };
  }
}
