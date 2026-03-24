import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';
import { JobsQueueService } from '../jobs/jobs-queue.service';

function uploadRoot(): string {
  return process.env.UPLOAD_DIR?.trim() || join(process.cwd(), 'uploads');
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

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

  /**
   * Upload a GeoNames postal codes tab-separated file and enqueue import (worker processes under UPLOAD_DIR).
   */
  @Post('geonames-import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(uploadRoot(), 'geonames');
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (_req, _file, cb) => {
          cb(null, `geonames-${Date.now()}-${randomUUID()}.txt`);
        },
      }),
      limits: { fileSize: 512 * 1024 * 1024 },
    }),
  )
  async enqueueGeonames(
    @Req() req: RequestWithStaff,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { truncate?: string; countryCode?: string },
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    if (!file?.path) {
      throw new BadRequestException('file is required (multipart field "file")');
    }
    const truncate =
      body.truncate === 'true' ||
      body.truncate === '1' ||
      body.truncate === 'on';
    const countryCode = body.countryCode?.trim().toUpperCase() || undefined;

    await this.jobs.enqueueGeonamesImport({
      source: 'upload',
      countryCode,
      filePath: file.path,
      truncate,
    });
    return { ok: true, queued: true, path: file.filename };
  }
}
