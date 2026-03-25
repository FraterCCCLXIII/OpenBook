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
        description: s.description,
        color: s.color,
        location: s.location,
        downPaymentType: s.downPaymentType,
        downPaymentValue: s.downPaymentValue?.toString() ?? null,
        serviceAreaOnly: s.serviceAreaOnly,
        availabilitiesType: s.availabilitiesType,
        attendantsNumber: s.attendantsNumber,
        isPrivate: s.isPrivate,
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
      description?: string;
      color?: string;
      location?: string;
      down_payment_type?: string;
      down_payment_value?: string;
      service_area_only?: number;
      attendants_number?: number;
      is_private?: number;
      availabilities_type?: string;
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
        description: body.description?.trim() ?? null,
        color: body.color ?? null,
        location: body.location?.trim() ?? null,
        downPaymentType: body.down_payment_type ?? 'none',
        downPaymentValue: body.down_payment_value != null ? body.down_payment_value : null,
        serviceAreaOnly: body.service_area_only ?? 0,
        idServiceCategories: catId,
        availabilitiesType: body.availabilities_type ?? 'flexible',
        attendantsNumber: body.attendants_number ?? 1,
        isPrivate: body.is_private ?? 0,
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
      description?: string | null;
      color?: string | null;
      location?: string | null;
      down_payment_type?: string;
      down_payment_value?: string | null;
      service_area_only?: number;
      availabilities_type?: string;
      attendants_number?: number;
      is_private?: number;
      id_service_categories?: string | null;
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
    const existing = await this.prisma.service.findUnique({ where: { id: sid } });
    if (!existing) throw new NotFoundException();

    let catId: bigint | null | undefined;
    if (body.id_service_categories === null) {
      catId = null;
    } else if (body.id_service_categories !== undefined) {
      try {
        catId = BigInt(body.id_service_categories);
      } catch {
        throw new BadRequestException('Invalid category id');
      }
    }

    await this.prisma.service.update({
      where: { id: sid },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() || null } : {}),
        ...(body.duration !== undefined ? { duration: body.duration } : {}),
        ...(body.price !== undefined ? { price: body.price === null ? null : body.price } : {}),
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(catId !== undefined ? { idServiceCategories: catId } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.location !== undefined ? { location: body.location?.trim() || null } : {}),
        ...(body.down_payment_type !== undefined ? { downPaymentType: body.down_payment_type } : {}),
        ...(body.down_payment_value !== undefined ? { downPaymentValue: body.down_payment_value === null ? null : body.down_payment_value } : {}),
        ...(body.service_area_only !== undefined ? { serviceAreaOnly: body.service_area_only } : {}),
        ...(body.availabilities_type !== undefined ? { availabilitiesType: body.availabilities_type } : {}),
        ...(body.attendants_number !== undefined ? { attendantsNumber: body.attendants_number } : {}),
        ...(body.is_private !== undefined ? { isPrivate: body.is_private } : {}),
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
