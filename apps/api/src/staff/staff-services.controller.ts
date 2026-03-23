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

@Controller('staff/services')
@UseGuards(StaffAuthGuard)
export class StaffServicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Req() req: RequestWithStaff,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    if (!canView(req.staffUser.permissions, 'services')) {
      throw new ForbiddenException();
    }
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(limitStr ?? '20', 10) || 20),
    );
    const offset = Math.max(0, Number.parseInt(offsetStr ?? '0', 10) || 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        take: limit,
        skip: offset,
        orderBy: { id: 'asc' },
        include: { category: true },
      }),
      this.prisma.service.count(),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        duration: s.duration,
        price: s.price?.toString() ?? null,
        currency: s.currency,
        availabilitiesType: s.availabilitiesType,
        attendantsNumber: s.attendantsNumber,
        categoryId: s.idServiceCategories?.toString() ?? null,
        categoryName: s.category?.name ?? null,
      })),
      total,
      limit,
      offset,
    };
  }

  @Post()
  async create(
    @Req() req: RequestWithStaff,
    @Body()
    body: {
      name?: string;
      duration?: number;
      price?: string;
      currency?: string;
      id_service_categories?: string;
    },
  ) {
    if (!can(req.staffUser.permissions, 'services', 'add')) {
      throw new ForbiddenException();
    }
    const name = body.name?.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }
    const duration = body.duration ?? 30;
    let catId: bigint | null = null;
    if (body.id_service_categories) {
      try {
        catId = BigInt(body.id_service_categories);
      } catch {
        throw new BadRequestException('Invalid category id');
      }
    }
    const created = await this.prisma.service.create({
      data: {
        name,
        duration,
        price: body.price != null ? body.price : null,
        currency: body.currency ?? 'USD',
        idServiceCategories: catId,
        availabilitiesType: 'flexible',
        attendantsNumber: 1,
        isPrivate: 0,
      },
    });
    return { id: created.id.toString() };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      duration?: number;
      price?: string | null;
      currency?: string;
    },
  ) {
    if (!can(req.staffUser.permissions, 'services', 'edit')) {
      throw new ForbiddenException();
    }
    let sid: bigint;
    try {
      sid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.service.findUnique({
      where: { id: sid },
    });
    if (!existing) {
      throw new NotFoundException();
    }
    await this.prisma.service.update({
      where: { id: sid },
      data: {
        name: body.name !== undefined ? body.name.trim() || null : undefined,
        duration: body.duration,
        price: body.price === null ? null : body.price,
        currency: body.currency,
      },
    });
    return { ok: true };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!can(req.staffUser.permissions, 'services', 'delete')) {
      throw new ForbiddenException();
    }
    let sid: bigint;
    try {
      sid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    await this.prisma.service.deleteMany({ where: { id: sid } });
    return { ok: true };
  }
}
