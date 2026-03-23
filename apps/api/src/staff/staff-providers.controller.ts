import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';

@Controller('staff/providers')
@UseGuards(StaffAuthGuard)
export class StaffProvidersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async one(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!canView(req.staffUser.permissions, 'users')) {
      throw new ForbiddenException();
    }
    let uid: bigint;
    try {
      uid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }

    const providerRole = await this.prisma.role.findFirst({
      where: { slug: 'provider' },
    });

    const user = await this.prisma.user.findFirst({
      where: {
        id: uid,
        ...(providerRole ? { idRoles: providerRole.id } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        timezone: true,
        userSettings: {
          select: {
            workingPlan: true,
            googleSync: true,
            googleCalendar: true,
            syncPastDays: true,
            syncFutureDays: true,
          },
        },
        serviceLinks: { select: { idServices: true } },
      },
    });

    if (!user) throw new NotFoundException();

    return {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      timezone: user.timezone,
      workingPlan: user.userSettings?.workingPlan ?? null,
      googleSync: (user.userSettings?.googleSync ?? 0) === 1,
      googleCalendar: user.userSettings?.googleCalendar ?? null,
      syncPastDays: user.userSettings?.syncPastDays ?? 7,
      syncFutureDays: user.userSettings?.syncFutureDays ?? 30,
      serviceIds: user.serviceLinks.map((l) => l.idServices.toString()),
    };
  }

  @Patch(':id')
  async update(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body()
    body: {
      working_plan?: string;
      timezone?: string;
      services?: string[];
    },
  ) {
    if (!can(req.staffUser.permissions, 'users', 'edit')) {
      throw new ForbiddenException();
    }
    let uid: bigint;
    try {
      uid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }

    const existing = await this.prisma.user.findUnique({ where: { id: uid } });
    if (!existing) throw new NotFoundException();

    // Update timezone on user
    if (body.timezone !== undefined) {
      await this.prisma.user.update({
        where: { id: uid },
        data: { timezone: body.timezone },
      });
    }

    // Update working plan in userSettings
    if (body.working_plan !== undefined) {
      try {
        JSON.parse(body.working_plan); // validate JSON
      } catch {
        throw new BadRequestException('working_plan must be valid JSON');
      }
      await this.prisma.userSettings.upsert({
        where: { idUsers: uid },
        create: { idUsers: uid, workingPlan: body.working_plan },
        update: { workingPlan: body.working_plan },
      });
    }

    // Update service assignments
    if (body.services !== undefined) {
      await this.prisma.serviceProvider.deleteMany({ where: { idUsers: uid } });
      if (body.services.length > 0) {
        await this.prisma.serviceProvider.createMany({
          data: body.services.map((sid) => ({
            idUsers: uid,
            idServices: BigInt(sid),
          })),
          skipDuplicates: true,
        });
      }
    }

    return this.one(req, id);
  }
}
