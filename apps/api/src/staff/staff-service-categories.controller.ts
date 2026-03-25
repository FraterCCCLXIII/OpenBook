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
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';

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

  @Post()
  async create(
    @Req() req: RequestWithStaff,
    @Body() body: { name?: string; description?: string },
  ) {
    if (!can(req.staffUser.permissions, 'services', 'add')) {
      throw new ForbiddenException();
    }
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    const row = await this.prisma.serviceCategory.create({
      data: { name, description: body.description?.trim() ?? null },
    });
    return { id: row.id.toString(), ok: true };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string | null },
  ) {
    if (!can(req.staffUser.permissions, 'services', 'edit')) {
      throw new ForbiddenException();
    }
    let cid: bigint;
    try {
      cid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.serviceCategory.findUnique({ where: { id: cid } });
    if (!existing) throw new NotFoundException();
    await this.prisma.serviceCategory.update({
      where: { id: cid },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() || null } : {}),
        ...(body.description !== undefined
          ? { description: body.description?.trim() || null }
          : {}),
      },
    });
    return { ok: true };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!can(req.staffUser.permissions, 'services', 'delete')) {
      throw new ForbiddenException();
    }
    let cid: bigint;
    try {
      cid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    await this.prisma.serviceCategory.deleteMany({ where: { id: cid } });
    return { ok: true };
  }
}
