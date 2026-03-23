import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';

/**
 * Queue / worker health — Redis URL presence only (no client dependency yet).
 * BullMQ or similar can plug in here later.
 */
@Controller('staff/system')
@UseGuards(StaffAuthGuard)
export class StaffSystemController {
  @Get('queue')
  queue(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    const url = process.env.REDIS_URL;
    return {
      redisUrlConfigured: Boolean(url),
      status: url ? 'redis_url_present' : 'not_configured',
      hint: 'Start workers with REDIS_URL pointing at docker-compose Redis when enabling job queues.',
    };
  }
}
