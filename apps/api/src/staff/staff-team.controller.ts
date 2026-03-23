import { randomBytes } from 'node:crypto';
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
import { hashPasswordEa } from '../auth/password.ea';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';

const ROLE_SLUGS = ['provider', 'secretary', 'admin'] as const;

const WORKING_PLAN_EMPTY = JSON.stringify({
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
});

@Controller('staff/team')
@UseGuards(StaffAuthGuard)
export class StaffTeamController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(':roleSlug')
  async create(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      username?: string;
      password?: string;
    },
  ) {
    if (!canView(req.staffUser.permissions, 'users')) {
      throw new ForbiddenException();
    }
    if (!ROLE_SLUGS.includes(roleSlug as (typeof ROLE_SLUGS)[number])) {
      throw new BadRequestException('Invalid role');
    }
    const email = body.email?.trim().toLowerCase();
    const username = body.username?.trim();
    const password = body.password?.trim();
    if (!email || !username || !password) {
      throw new BadRequestException(
        'email, username, and password are required',
      );
    }

    const role = await this.prisma.role.findFirst({
      where: { slug: roleSlug },
    });
    if (!role) {
      throw new BadRequestException('Unknown role');
    }

    const salt = randomBytes(64).toString('hex');
    const hashed = hashPasswordEa(salt, password);

    const user = await this.prisma.user.create({
      data: {
        firstName: body.firstName?.trim() || null,
        lastName: body.lastName?.trim() || null,
        email,
        idRoles: role.id,
        timezone: 'UTC',
        language: 'english',
      },
    });

    await this.prisma.userSettings.create({
      data: {
        idUsers: user.id,
        username,
        password: hashed,
        salt,
        workingPlan: WORKING_PLAN_EMPTY,
        workingPlanExceptions: null,
      },
    });

    return { id: user.id.toString(), email: user.email };
  }

  @Patch(':roleSlug/:id')
  async update(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
    @Param('id') id: string,
    @Body()
    body: { firstName?: string; lastName?: string; email?: string },
  ) {
    if (!canView(req.staffUser.permissions, 'users')) {
      throw new ForbiddenException();
    }
    if (!ROLE_SLUGS.includes(roleSlug as (typeof ROLE_SLUGS)[number])) {
      throw new BadRequestException('Invalid role');
    }

    const role = await this.prisma.role.findFirst({
      where: { slug: roleSlug },
    });
    if (!role) {
      throw new BadRequestException('Unknown role');
    }

    let userId: bigint;
    try {
      userId = BigInt(id);
    } catch {
      throw new BadRequestException('Invalid id');
    }

    const existing = await this.prisma.user.findFirst({
      where: { id: userId, idRoles: role.id },
    });
    if (!existing) {
      throw new NotFoundException();
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName:
          body.firstName !== undefined
            ? body.firstName.trim() || null
            : undefined,
        lastName:
          body.lastName !== undefined
            ? body.lastName.trim() || null
            : undefined,
        email:
          body.email !== undefined
            ? body.email.trim().toLowerCase() || null
            : undefined,
      },
    });

    return {
      id: updated.id.toString(),
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
    };
  }

  @Delete(':roleSlug/:id')
  async remove(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
    @Param('id') id: string,
  ) {
    if (!canView(req.staffUser.permissions, 'users')) {
      throw new ForbiddenException();
    }
    if (!ROLE_SLUGS.includes(roleSlug as (typeof ROLE_SLUGS)[number])) {
      throw new BadRequestException('Invalid role');
    }

    const role = await this.prisma.role.findFirst({
      where: { slug: roleSlug },
    });
    if (!role) {
      throw new BadRequestException('Unknown role');
    }

    let userId: bigint;
    try {
      userId = BigInt(id);
    } catch {
      throw new BadRequestException('Invalid id');
    }

    if (userId === BigInt(req.staffUser.userId)) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const existing = await this.prisma.user.findFirst({
      where: { id: userId, idRoles: role.id },
    });
    if (!existing) {
      throw new NotFoundException();
    }

    await this.prisma.user.delete({ where: { id: userId } });

    return { ok: true };
  }

  @Get(':roleSlug')
  async listByRole(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
  ) {
    if (!canView(req.staffUser.permissions, 'users')) {
      throw new ForbiddenException();
    }
    if (!ROLE_SLUGS.includes(roleSlug as (typeof ROLE_SLUGS)[number])) {
      throw new BadRequestException('Invalid role');
    }

    const role = await this.prisma.role.findFirst({
      where: { slug: roleSlug },
    });
    if (!role) {
      return { items: [] };
    }

    const rows = await this.prisma.user.findMany({
      where: { idRoles: role.id },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return {
      items: rows.map((u) => ({
        id: u.id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        displayName:
          [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
          u.email ||
          `User ${u.id}`,
      })),
    };
  }
}
