import { randomBytes, randomUUID } from 'node:crypto';
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
import { hashPasswordEa } from '../auth/password.ea';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

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
    if (!can(req.staffUser.permissions, 'users', 'add')) {
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
    body: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string },
  ) {
    if (!can(req.staffUser.permissions, 'users', 'edit')) {
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
        phoneNumber:
          body.phoneNumber !== undefined
            ? body.phoneNumber.trim() || null
            : undefined,
      },
    });

    return {
      id: updated.id.toString(),
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phoneNumber: updated.phoneNumber,
    };
  }

  @Delete(':roleSlug/:id')
  async remove(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
    @Param('id') id: string,
  ) {
    if (!can(req.staffUser.permissions, 'users', 'delete')) {
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

  /** Single team member — must be registered before `GET :roleSlug` (list). */
  @Get(':roleSlug/:id')
  async one(
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
      throw new NotFoundException();
    }

    let userId: bigint;
    try {
      userId = BigInt(id);
    } catch {
      throw new BadRequestException('Invalid id');
    }

    const u = await this.prisma.user.findFirst({
      where: { id: userId, idRoles: role.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
    });
    if (!u) {
      throw new NotFoundException();
    }

    return {
      id: u.id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      displayName:
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
        u.email ||
        `User ${u.id}`,
    };
  }

  // ─── Files ───────────────────────────────────────────────────────────────

  private async resolveTeamUser(roleSlug: string, id: string): Promise<bigint> {
    if (!ROLE_SLUGS.includes(roleSlug as (typeof ROLE_SLUGS)[number])) {
      throw new BadRequestException('Invalid role');
    }
    const role = await this.prisma.role.findFirst({ where: { slug: roleSlug } });
    if (!role) throw new NotFoundException();
    let uid: bigint;
    try {
      uid = BigInt(id);
    } catch {
      throw new BadRequestException('Invalid id');
    }
    const u = await this.prisma.user.findFirst({ where: { id: uid, idRoles: role.id } });
    if (!u) throw new NotFoundException();
    return uid;
  }

  @Get(':roleSlug/:id/files')
  async listFiles(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
    @Param('id') id: string,
  ) {
    if (!canView(req.staffUser.permissions, 'users')) throw new ForbiddenException();
    const uid = await this.resolveTeamUser(roleSlug, id);
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

  @Post(':roleSlug/:id/files')
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
    @Param('roleSlug') roleSlug: string,
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
    const uid = await this.resolveTeamUser(roleSlug, id);
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

  @Get(':roleSlug/:id/files/:fileId')
  async serveFile(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!canView(req.staffUser.permissions, 'users')) throw new ForbiddenException();
    const uid = await this.resolveTeamUser(roleSlug, id);
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

  @Delete(':roleSlug/:id/files/:fileId')
  async deleteFile(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ) {
    if (!can(req.staffUser.permissions, 'users', 'edit')) throw new ForbiddenException();
    const uid = await this.resolveTeamUser(roleSlug, id);
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
