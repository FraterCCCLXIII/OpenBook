import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
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
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';

const UPLOAD_HARD_LIMIT_BYTES = 10240 * 1024 * 1024;

function uploadRoot(): string {
  return process.env.UPLOAD_DIR?.trim() || join(process.cwd(), 'uploads');
}

function ensureUploadDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function safeDeleteFile(filename: string) {
  try { unlinkSync(join(uploadRoot(), 'user-files', filename)); } catch { /* ignore */ }
}

@Controller('staff/providers')
@UseGuards(StaffAuthGuard)
export class StaffProvidersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

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
        phoneNumber: true,
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
      phoneNumber: user.phoneNumber,
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
      first_name?: string;
      last_name?: string;
      phone_number?: string;
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

    // Update profile fields + timezone on user
    const profileUpdate: Record<string, unknown> = {};
    if (body.first_name !== undefined) profileUpdate.firstName = body.first_name.trim() || null;
    if (body.last_name !== undefined) profileUpdate.lastName = body.last_name.trim() || null;
    if (body.phone_number !== undefined) profileUpdate.phoneNumber = body.phone_number.trim() || null;
    if (body.timezone !== undefined) profileUpdate.timezone = body.timezone;
    if (Object.keys(profileUpdate).length > 0) {
      await this.prisma.user.update({ where: { id: uid }, data: profileUpdate });
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

  @Get(':id/appointments')
  async listAppointments(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!canView(req.staffUser.permissions, 'appointments')) {
      throw new ForbiddenException();
    }
    let uid: bigint;
    try {
      uid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }

    const rows = await this.prisma.appointment.findMany({
      where: { idUsersProvider: uid, isUnavailability: 0 },
      orderBy: { startDatetime: 'desc' },
      take: 100,
      include: {
        service: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    const now = new Date();
    return {
      items: rows.map((a) => {
        const end = a.endDatetime;
        const start = a.startDatetime;
        let status: string;
        if (end && end < now) status = 'Completed';
        else if (start && start > now) status = 'Booked';
        else status = 'In progress';
        return {
          id: a.id.toString(),
          startDatetime: start?.toISOString() ?? null,
          endDatetime: end?.toISOString() ?? null,
          serviceName: a.service?.name ?? null,
          customerName:
            [a.customer?.firstName, a.customer?.lastName].filter(Boolean).join(' ') || null,
          status,
        };
      }),
    };
  }

  // ─── Files ───────────────────────────────────────────────────────────────

  private async resolveProvider(id: string): Promise<bigint> {
    let uid: bigint;
    try {
      uid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const u = await this.prisma.user.findUnique({ where: { id: uid } });
    if (!u) throw new NotFoundException();
    return uid;
  }

  @Get(':id/files')
  async listFiles(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!canView(req.staffUser.permissions, 'users')) throw new ForbiddenException();
    const uid = await this.resolveProvider(id);
    const rows = await this.prisma.userFile.findMany({
      where: { idUsers: uid },
      orderBy: { createDatetime: 'desc' },
      take: 100,
    });
    return {
      items: rows.map((f) => ({
        id: f.id.toString(),
        filename: f.filename,
        originalName: f.originalName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        createdAt: f.createDatetime?.toISOString() ?? null,
      })),
    };
  }

  @Post(':id/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(uploadRoot(), 'user-files');
          ensureUploadDir(dir);
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = file.originalname.includes('.')
            ? file.originalname.slice(file.originalname.lastIndexOf('.'))
            : '';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: UPLOAD_HARD_LIMIT_BYTES },
    }),
  )
  async uploadFile(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!can(req.staffUser.permissions, 'users', 'edit')) throw new ForbiddenException();
    if (!file?.filename) throw new BadRequestException('file is required');
    const limitMb = parseInt((await this.settings.getSettingByName('max_upload_size_mb')) ?? '15', 10) || 15;
    if (file.size > limitMb * 1024 * 1024) {
      safeDeleteFile(file.filename);
      throw new BadRequestException(`File exceeds the configured limit of ${limitMb} MB`);
    }
    const uid = await this.resolveProvider(id);
    await this.prisma.userFile.create({
      data: {
        idUsers: uid,
        filename: file.filename,
        originalName: file.originalname.slice(0, 500),
        mimeType: (file.mimetype || 'application/octet-stream').slice(0, 128),
        sizeBytes: Math.min(file.size, 2_000_000_000),
      },
    });
    return { ok: true };
  }

  @Get(':id/files/:fileId')
  async serveFile(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!canView(req.staffUser.permissions, 'users')) throw new ForbiddenException();
    const uid = await this.resolveProvider(id);
    let fid: bigint;
    try { fid = BigInt(fileId); } catch { throw new NotFoundException(); }
    const row = await this.prisma.userFile.findFirst({ where: { id: fid, idUsers: uid } });
    if (!row) throw new NotFoundException();
    const filePath = join(uploadRoot(), 'user-files', row.filename);
    if (!existsSync(filePath)) throw new NotFoundException('File not found on disk');
    const disposition = download === '1' ? 'attachment' : 'inline';
    const safeName = encodeURIComponent(row.originalName).replace(/%20/g, ' ');
    res.set('Content-Type', row.mimeType || 'application/octet-stream');
    res.set('Content-Disposition', `${disposition}; filename="${safeName}"`);
    return new StreamableFile(createReadStream(filePath));
  }

  @Delete(':id/files/:fileId')
  async deleteFile(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ) {
    if (!can(req.staffUser.permissions, 'users', 'edit')) throw new ForbiddenException();
    const uid = await this.resolveProvider(id);
    let fid: bigint;
    try {
      fid = BigInt(fileId);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.userFile.findFirst({ where: { id: fid, idUsers: uid } });
    if (!existing) throw new NotFoundException();
    const pathOnDisk = join(uploadRoot(), 'user-files', existing.filename);
    await this.prisma.userFile.delete({ where: { id: fid } });
    try {
      unlinkSync(pathOnDisk);
    } catch { /* ignore */ }
    return { ok: true };
  }
}
