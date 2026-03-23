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

@Controller('staff/webhooks')
@UseGuards(StaffAuthGuard)
export class StaffWebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'webhooks')) {
      throw new ForbiddenException();
    }
    const rows = await this.prisma.webhook.findMany({ orderBy: { id: 'asc' } });
    return { items: rows.map(mapWebhook) };
  }

  @Post()
  async create(
    @Req() req: RequestWithStaff,
    @Body()
    body: {
      name?: string;
      url?: string;
      actions?: string;
      notes?: string;
      secretToken?: string;
    },
  ) {
    if (!can(req.staffUser.permissions, 'webhooks', 'add')) {
      throw new ForbiddenException();
    }
    if (!body.name?.trim() || !body.url?.trim()) {
      throw new BadRequestException('name and url are required');
    }
    const now = new Date();
    const row = await this.prisma.webhook.create({
      data: {
        name: body.name.trim(),
        url: body.url.trim(),
        actions: body.actions ?? null,
        secretToken: body.secretToken ?? null,
        isActive: 1,
        isSslVerified: 1,
        notes: body.notes ?? null,
        createDatetime: now,
        updateDatetime: now,
      },
    });
    return mapWebhook(row);
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      url?: string;
      actions?: string;
      notes?: string;
      secretToken?: string;
      isActive?: number;
    },
  ) {
    if (!can(req.staffUser.permissions, 'webhooks', 'edit')) {
      throw new ForbiddenException();
    }
    const existing = await this.prisma.webhook.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.webhook.update({
      where: { id: Number(id) },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.url !== undefined ? { url: body.url.trim() } : {}),
        ...(body.actions !== undefined ? { actions: body.actions } : {}),
        ...(body.secretToken !== undefined
          ? { secretToken: body.secretToken }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        updateDatetime: new Date(),
      },
    });
    return mapWebhook(row);
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!can(req.staffUser.permissions, 'webhooks', 'delete')) {
      throw new ForbiddenException();
    }
    await this.prisma.webhook.deleteMany({ where: { id: Number(id) } });
    return { ok: true };
  }
}

function mapWebhook(w: {
  id: number;
  name: string;
  url: string;
  actions: string | null;
  secretToken: string | null;
  isActive: number;
  notes: string | null;
}) {
  return {
    id: w.id,
    name: w.name,
    url: w.url,
    actions: w.actions,
    isActive: w.isActive === 1,
    notes: w.notes,
  };
}
