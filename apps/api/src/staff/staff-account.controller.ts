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
    };
  }

  @Patch()
  async patch(
    @Req() req: RequestWithStaff,
    @Body()
    body: {
      working_plan?: string;
      working_plan_exceptions?: string | null;
    },
  ) {
    if (!canView(req.staffUser.permissions, 'user_settings')) {
      throw new ForbiddenException();
    }
    const uid = BigInt(req.staffUser.userId);
    const data: {
      workingPlan?: string;
      workingPlanExceptions?: string | null;
    } = {};
    if (body.working_plan !== undefined) {
      data.workingPlan = body.working_plan;
    }
    if (body.working_plan_exceptions !== undefined) {
      data.workingPlanExceptions = body.working_plan_exceptions;
    }
    if (Object.keys(data).length === 0) {
      return { ok: true };
    }
    await this.prisma.userSettings.update({
      where: { idUsers: uid },
      data,
    });
    return { ok: true };
  }
}
