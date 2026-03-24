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

@Controller('staff/custom-fields')
@UseGuards(StaffAuthGuard)
export class StaffCustomFieldsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    const rows = await this.prisma.customField.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return {
      items: rows.map((f) => ({
        id: f.id,
        name: f.name,
        fieldType: f.fieldType,
        defaultValue: f.defaultValue,
        isRequired: f.isRequired,
        isDisplayed: f.isDisplayed,
        isActive: f.isActive,
        sortOrder: f.sortOrder,
      })),
    };
  }

  @Post()
  async create(
    @Req() req: RequestWithStaff,
    @Body()
    body: {
      name?: string;
      field_type?: string;
      default_value?: string | null;
      is_required?: number;
      is_displayed?: number;
      is_active?: number;
      sort_order?: number;
    },
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    const name = body.name?.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }
    const row = await this.prisma.customField.create({
      data: {
        name,
        fieldType: body.field_type?.trim() || 'input',
        defaultValue: body.default_value ?? null,
        isRequired: body.is_required ?? 0,
        isDisplayed: body.is_displayed ?? 1,
        isActive: body.is_active ?? 1,
        sortOrder: body.sort_order ?? 0,
      },
    });
    return { id: row.id, ok: true };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      field_type?: string;
      default_value?: string | null;
      is_required?: number;
      is_displayed?: number;
      is_active?: number;
      sort_order?: number;
    },
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    let fid: number;
    try {
      fid = Number.parseInt(id, 10);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.customField.findUnique({
      where: { id: fid },
    });
    if (!existing) throw new NotFoundException();

    await this.prisma.customField.update({
      where: { id: fid },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.field_type !== undefined
          ? { fieldType: body.field_type.trim() }
          : {}),
        ...(body.default_value !== undefined
          ? { defaultValue: body.default_value }
          : {}),
        ...(body.is_required !== undefined ? { isRequired: body.is_required } : {}),
        ...(body.is_displayed !== undefined
          ? { isDisplayed: body.is_displayed }
          : {}),
        ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
        ...(body.sort_order !== undefined ? { sortOrder: body.sort_order } : {}),
      },
    });
    return { ok: true };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    let fid: number;
    try {
      fid = Number.parseInt(id, 10);
    } catch {
      throw new NotFoundException();
    }
    const res = await this.prisma.customField.deleteMany({
      where: { id: fid },
    });
    if (res.count === 0) throw new NotFoundException();
    return { ok: true };
  }
}
