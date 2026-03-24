import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';

@Controller('staff/account')
@UseGuards(StaffAuthGuard)
export class StaffAccountController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'user_settings')) {
      throw new ForbiddenException();
    }
    const uid = BigInt(req.staffUser.userId);
    const u = await this.prisma.user.findUnique({
      where: { id: uid },
      include: { userSettings: true },
    });
    return {
      workingPlan: u?.userSettings?.workingPlan ?? null,
      workingPlanExceptions: u?.userSettings?.workingPlanExceptions ?? null,
      firstName: u?.firstName ?? null,
      lastName: u?.lastName ?? null,
      email: u?.email ?? null,
      phoneNumber: u?.phoneNumber ?? null,
      address: u?.address ?? null,
      city: u?.city ?? null,
      state: u?.state ?? null,
      zipCode: u?.zipCode ?? null,
      timezone: u?.timezone ?? null,
      language: u?.language ?? null,
    };
  }

  @Patch()
  async patch(
    @Req() req: RequestWithStaff,
    @Body()
    body: {
      working_plan?: string;
      working_plan_exceptions?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      phone_number?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      zip_code?: string | null;
      timezone?: string | null;
      language?: string | null;
    },
  ) {
    if (!canView(req.staffUser.permissions, 'user_settings')) {
      throw new ForbiddenException();
    }
    const uid = BigInt(req.staffUser.userId);
    const settingsData: {
      workingPlan?: string;
      workingPlanExceptions?: string | null;
    } = {};
    if (body.working_plan !== undefined) {
      settingsData.workingPlan = body.working_plan;
    }
    if (body.working_plan_exceptions !== undefined) {
      settingsData.workingPlanExceptions = body.working_plan_exceptions;
    }

    const userData: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      timezone?: string | null;
      language?: string | null;
    } = {};
    if (body.first_name !== undefined) userData.firstName = body.first_name;
    if (body.last_name !== undefined) userData.lastName = body.last_name;
    if (body.email !== undefined) userData.email = body.email;
    if (body.phone_number !== undefined) userData.phoneNumber = body.phone_number;
    if (body.address !== undefined) userData.address = body.address;
    if (body.city !== undefined) userData.city = body.city;
    if (body.state !== undefined) userData.state = body.state;
    if (body.zip_code !== undefined) userData.zipCode = body.zip_code;
    if (body.timezone !== undefined) userData.timezone = body.timezone;
    if (body.language !== undefined) userData.language = body.language;

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.update({
        where: { id: uid },
        data: userData,
      });
    }

    if (Object.keys(settingsData).length > 0) {
      await this.prisma.userSettings.upsert({
        where: { idUsers: uid },
        create: {
          idUsers: uid,
          workingPlan: settingsData.workingPlan ?? '{}',
          workingPlanExceptions:
            settingsData.workingPlanExceptions !== undefined
              ? settingsData.workingPlanExceptions
              : null,
        },
        update: settingsData,
      });
    }

    return { ok: true };
  }
}
