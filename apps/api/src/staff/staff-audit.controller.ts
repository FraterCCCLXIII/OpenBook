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

@Controller('staff/audit-logs')
@UseGuards(StaffAuthGuard)
export class StaffAuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { id: 'desc' },
      take: 200,
    });
    return {
      items: rows.map((r) => ({
        id: r.id.toString(),
        createdAt: r.createdAt.toISOString(),
        action: r.action,
      })),
    };
  }
}
