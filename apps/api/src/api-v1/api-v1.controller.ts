import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiV1TokenGuard } from './api-v1.guard';

@Controller('v1')
@UseGuards(ApiV1TokenGuard)
export class ApiV1Controller {
  constructor(private readonly prisma: PrismaService) {}

  /** Minimal probe for REST v1 + Bearer parity (expand with real settings resource). */
  @Get('ping')
  ping() {
    return { ok: true, service: 'openbook-api', api: 'v1' };
  }

  @Get('services')
  async services(@Query('take') takeRaw?: string) {
    const take = Math.min(
      100,
      Math.max(1, Number.parseInt(takeRaw ?? '50', 10) || 50),
    );
    const rows = await this.prisma.service.findMany({
      take,
      orderBy: { id: 'asc' },
      include: { category: true },
    });
    return {
      items: rows.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        duration: s.duration,
        price: s.price?.toString() ?? null,
        currency: s.currency,
        description: s.description,
        categoryId: s.idServiceCategories?.toString() ?? null,
        categoryName: s.category?.name ?? null,
        attendantsNumber: s.attendantsNumber,
      })),
    };
  }

  @Get('appointments')
  async appointments(@Query('take') takeRaw?: string) {
    const take = Math.min(
      100,
      Math.max(1, Number.parseInt(takeRaw ?? '50', 10) || 50),
    );
    const rows = await this.prisma.appointment.findMany({
      take,
      orderBy: { id: 'desc' },
      where: { isUnavailability: 0 },
    });
    return {
      items: rows.map((a) => ({
        id: a.id.toString(),
        startDatetime: a.startDatetime?.toISOString() ?? null,
        endDatetime: a.endDatetime?.toISOString() ?? null,
        idUsersProvider: a.idUsersProvider?.toString() ?? null,
        idUsersCustomer: a.idUsersCustomer?.toString() ?? null,
        idServices: a.idServices?.toString() ?? null,
      })),
    };
  }
}
