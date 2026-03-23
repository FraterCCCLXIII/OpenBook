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

@Controller('staff/service-categories')
@UseGuards(StaffAuthGuard)
export class StaffServiceCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'services')) {
      throw new ForbiddenException();
    }
    const rows = await this.prisma.serviceCategory.findMany({
      orderBy: { id: 'asc' },
    });
    return {
      items: rows.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        description: c.description,
      })),
    };
  }
}
