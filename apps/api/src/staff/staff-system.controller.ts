import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';
import { JobsQueueService } from '../jobs/jobs-queue.service';

/**
 * Queue / worker health — Redis URL presence only (no client dependency yet).
 * BullMQ or similar can plug in here later.
 */
@Controller('staff/system')
@UseGuards(StaffAuthGuard)
export class StaffSystemController {
  constructor(private readonly jobs: JobsQueueService) {}

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

  /** Queue a GeoNames import job (worker stub; load CSV via future tooling). */
  @Post('geonames-import')
  async enqueueGeonames(
    @Req() req: RequestWithStaff,
    @Body() body: { countryCode?: string },
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    await this.jobs.enqueueGeonamesImport({
      countryCode: body.countryCode,
    });
    return { ok: true };
  }
}
