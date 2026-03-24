import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';
import { PrismaService } from '../prisma/prisma.service';

@Controller('staff/consents')
@UseGuards(StaffAuthGuard)
export class StaffConsentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Req() req: RequestWithStaff,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Query('type') type?: string,
  ) {
    if (!canView(req.staffUser.permissions, 'customers')) {
      throw new ForbiddenException();
    }
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(limitStr ?? '50', 10) || 50),
    );
    const offset = Math.max(0, Number.parseInt(offsetStr ?? '0', 10) || 0);

    const where = type?.trim()
      ? { type: type.trim() }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.consent.findMany({
        where,
        orderBy: { createDatetime: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.consent.count({ where }),
    ]);

    return {
      total,
      items: rows.map((c) => ({
        id: c.id,
        type: c.type,
        ip: c.ip,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        userId: c.idUsers?.toString() ?? null,
        userEmail: c.user?.email ?? null,
        userDisplayName:
          [c.user?.firstName, c.user?.lastName].filter(Boolean).join(' ').trim() ||
          c.user?.email ||
          null,
        createdAt: c.createDatetime?.toISOString() ?? null,
      })),
    };
  }
}
