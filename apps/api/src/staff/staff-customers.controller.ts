import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
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

@Controller('staff/customers')
@UseGuards(StaffAuthGuard)
export class StaffCustomersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Req() req: RequestWithStaff,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    if (!canView(req.staffUser.permissions, 'customers')) {
      throw new ForbiddenException();
    }
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(limitStr ?? '20', 10) || 20),
    );
    const offset = Math.max(0, Number.parseInt(offsetStr ?? '0', 10) || 0);

    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    if (!customerRole) {
      return { items: [], total: 0 };
    }

    const where = { idRoles: customerRole.id };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
      })),
      total,
      limit,
      offset,
    };
  }

  @Get(':id')
  async one(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!canView(req.staffUser.permissions, 'customers')) {
      throw new ForbiddenException();
    }
    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    if (!customerRole) {
      throw new NotFoundException();
    }
    let uid: bigint;
    try {
      uid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const u = await this.prisma.user.findFirst({
      where: { id: uid, idRoles: customerRole.id },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!u) {
      throw new NotFoundException();
    }
    return {
      id: u.id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    };
  }

  @Patch(':id')
  async patch(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body() body: { first_name?: string; last_name?: string; email?: string },
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    if (!customerRole) {
      throw new NotFoundException();
    }
    let uid: bigint;
    try {
      uid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.user.findFirst({
      where: { id: uid, idRoles: customerRole.id },
    });
    if (!existing) {
      throw new NotFoundException();
    }
    const email = body.email?.trim().toLowerCase();
    if (email) {
      const clash = await this.prisma.user.findFirst({
        where: { email, NOT: { id: uid } },
      });
      if (clash) {
        throw new BadRequestException('Email already in use');
      }
    }
    const updated = await this.prisma.user.update({
      where: { id: uid },
      data: {
        firstName:
          body.first_name !== undefined ? body.first_name.trim() || null : undefined,
        lastName:
          body.last_name !== undefined ? body.last_name.trim() || null : undefined,
        email: email !== undefined ? email || null : undefined,
      },
    });
    if (email !== undefined && updated.email) {
      await this.prisma.customerAuth.updateMany({
        where: { customerId: uid },
        data: { email: updated.email },
      });
    }
    return {
      id: updated.id.toString(),
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
    };
  }
}
