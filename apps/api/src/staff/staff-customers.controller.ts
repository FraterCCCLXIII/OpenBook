import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';

function uploadRoot(): string {
  return process.env.UPLOAD_DIR?.trim() || join(process.cwd(), 'uploads');
}

function ensureUploadDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

@Controller('staff/customers')
@UseGuards(StaffAuthGuard)
export class StaffCustomersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** When enabled, providers/secretaries cannot use the CRM customer directory. */
  private async assertCustomerDirectoryAccess(
    req: RequestWithStaff,
  ): Promise<void> {
    const slug = req.staffUser.roleSlug;
    if (slug === 'provider') {
      const v = await this.settings.getSettingByName(
        'limit_provider_customer_access',
      );
      if (v === '1') {
        throw new ForbiddenException(
          'Customer directory is disabled for providers.',
        );
      }
    }
    if (slug === 'secretary') {
      const v = await this.settings.getSettingByName(
        'limit_secretary_customer_access',
      );
      if (v === '1') {
        throw new ForbiddenException(
          'Customer directory is disabled for secretaries.',
        );
      }
    }
  }

  private async assertCustomerUser(id: string): Promise<bigint> {
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
    });
    if (!u) {
      throw new NotFoundException();
    }
    return uid;
  }

  @Get()
  async list(
    @Req() req: RequestWithStaff,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    if (!canView(req.staffUser.permissions, 'customers')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
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

  @Post(':id/notes')
  async addNote(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const uid = await this.assertCustomerUser(id);
    const text = body.notes?.trim();
    if (!text) {
      throw new BadRequestException('notes is required');
    }
    const row = await this.prisma.customerNote.create({
      data: {
        idUsers: uid,
        notes: text,
      },
    });
    return {
      id: row.id.toString(),
      notes: row.notes,
      createDatetime: row.createDatetime?.toISOString() ?? null,
    };
  }

  @Delete(':id/notes/:noteId')
  async removeNote(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const uid = await this.assertCustomerUser(id);
    let nid: bigint;
    try {
      nid = BigInt(noteId);
    } catch {
      throw new NotFoundException();
    }
    const res = await this.prisma.customerNote.deleteMany({
      where: { id: nid, idUsers: uid },
    });
    if (res.count === 0) {
      throw new NotFoundException();
    }
    return { ok: true };
  }

  @Post(':id/alerts')
  async addAlert(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body() body: { message?: string },
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const uid = await this.assertCustomerUser(id);
    const message = body.message?.trim();
    if (!message) {
      throw new BadRequestException('message is required');
    }
    const row = await this.prisma.customerAlert.create({
      data: { idUsers: uid, message, isRead: 0 },
    });
    return {
      id: row.id.toString(),
      message: row.message,
      isRead: row.isRead,
      createDatetime: row.createDatetime?.toISOString() ?? null,
    };
  }

  @Patch(':id/alerts/:alertId')
  async patchAlert(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Param('alertId') alertId: string,
    @Body() body: { message?: string; is_read?: number },
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const uid = await this.assertCustomerUser(id);
    let aid: bigint;
    try {
      aid = BigInt(alertId);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.customerAlert.findFirst({
      where: { id: aid, idUsers: uid },
    });
    if (!existing) {
      throw new NotFoundException();
    }
    const row = await this.prisma.customerAlert.update({
      where: { id: aid },
      data: {
        ...(body.message !== undefined ? { message: body.message } : {}),
        ...(body.is_read !== undefined ? { isRead: body.is_read ? 1 : 0 } : {}),
      },
    });
    return {
      id: row.id.toString(),
      message: row.message,
      isRead: row.isRead,
    };
  }

  @Delete(':id/alerts/:alertId')
  async removeAlert(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Param('alertId') alertId: string,
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const uid = await this.assertCustomerUser(id);
    let aid: bigint;
    try {
      aid = BigInt(alertId);
    } catch {
      throw new NotFoundException();
    }
    const res = await this.prisma.customerAlert.deleteMany({
      where: { id: aid, idUsers: uid },
    });
    if (res.count === 0) {
      throw new NotFoundException();
    }
    return { ok: true };
  }

  @Patch(':id/custom-fields')
  async patchCustomFields(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body() body: { values?: Record<string, string> },
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const uid = await this.assertCustomerUser(id);
    const values = body.values ?? {};
    for (const [fieldIdStr, raw] of Object.entries(values)) {
      let fieldId: number;
      try {
        fieldId = Number.parseInt(fieldIdStr, 10);
      } catch {
        throw new BadRequestException(`Invalid field id: ${fieldIdStr}`);
      }
      const field = await this.prisma.customField.findFirst({
        where: { id: fieldId, isActive: 1 },
      });
      if (!field) {
        throw new BadRequestException(`Unknown custom field: ${fieldId}`);
      }
      const value = raw ?? '';
      const existing = await this.prisma.customerCustomFieldValue.findFirst({
        where: { idUsers: uid, idCustomFields: fieldId },
      });
      if (existing) {
        await this.prisma.customerCustomFieldValue.update({
          where: { id: existing.id },
          data: { value },
        });
      } else {
        await this.prisma.customerCustomFieldValue.create({
          data: {
            idUsers: uid,
            idCustomFields: fieldId,
            value,
          },
        });
      }
    }
    return { ok: true };
  }

  @Get(':id/files')
  async listFiles(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!canView(req.staffUser.permissions, 'customers')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const uid = await this.assertCustomerUser(id);
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
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    if (!file?.filename) {
      throw new BadRequestException('file is required');
    }
    const uid = await this.assertCustomerUser(id);
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

  @Delete(':id/files/:fileId')
  async deleteFile(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const uid = await this.assertCustomerUser(id);
    let fid: bigint;
    try {
      fid = BigInt(fileId);
    } catch {
      throw new NotFoundException();
    }
    const existing = await this.prisma.userFile.findFirst({
      where: { id: fid, idUsers: uid },
    });
    if (!existing) throw new NotFoundException();
    const pathOnDisk = join(uploadRoot(), 'user-files', existing.filename);
    await this.prisma.userFile.delete({ where: { id: fid } });
    try {
      unlinkSync(pathOnDisk);
    } catch {
      /* ignore */
    }
    return { ok: true };
  }

  @Get(':id')
  async one(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!canView(req.staffUser.permissions, 'customers')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        city: true,
        zipCode: true,
      },
    });
    if (!u) {
      throw new NotFoundException();
    }

    const [notes, alerts, customFields, valueRows] = await Promise.all([
      this.prisma.customerNote.findMany({
        where: { idUsers: uid },
        orderBy: { createDatetime: 'desc' },
        take: 50,
      }),
      this.prisma.customerAlert.findMany({
        where: { idUsers: uid },
        orderBy: { createDatetime: 'desc' },
        take: 50,
      }),
      this.prisma.customField.findMany({
        where: { isActive: 1 },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.customerCustomFieldValue.findMany({
        where: { idUsers: uid },
      }),
    ]);

    const valueByField = new Map<number, string>();
    for (const v of valueRows) {
      valueByField.set(v.idCustomFields, v.value ?? '');
    }

    return {
      id: u.id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      address: u.address,
      city: u.city,
      zipCode: u.zipCode,
      notes: notes.map((n) => ({
        id: n.id.toString(),
        notes: n.notes,
        createDatetime: n.createDatetime?.toISOString() ?? null,
      })),
      alerts: alerts.map((a) => ({
        id: a.id.toString(),
        message: a.message,
        isRead: a.isRead,
        createDatetime: a.createDatetime?.toISOString() ?? null,
      })),
      customFields: customFields.map((f) => ({
        id: f.id,
        name: f.name,
        fieldType: f.fieldType,
        isRequired: f.isRequired,
        value: valueByField.get(f.id) ?? '',
      })),
    };
  }

  @Post()
  async create(
    @Req() req: RequestWithStaff,
    @Body()
    body: {
      first_name?: string;
      last_name?: string;
      email?: string;
    },
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'add')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const email = body.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('email is required');
    }
    const existing = await this.prisma.user.findFirst({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    if (!customerRole) {
      throw new BadRequestException('Customer role not found');
    }
    const user = await this.prisma.user.create({
      data: {
        firstName: body.first_name?.trim() || null,
        lastName: body.last_name?.trim() || null,
        email,
        idRoles: customerRole.id,
        timezone: 'UTC',
      },
    });
    return {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!can(req.staffUser.permissions, 'customers', 'delete')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    let uid: bigint;
    try {
      uid = BigInt(id);
    } catch {
      throw new NotFoundException();
    }
    const user = await this.prisma.user.findFirst({
      where: { id: uid, ...(customerRole ? { idRoles: customerRole.id } : {}) },
    });
    if (!user) {
      throw new NotFoundException();
    }
    // Clean up related auth records first
    await this.prisma.customerAuth.deleteMany({ where: { customerId: uid } });
    await this.prisma.user.delete({ where: { id: uid } });
    return { ok: true };
  }

  @Patch(':id')
  async patch(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body()
    body: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone_number?: string;
      address?: string;
      city?: string;
      zip_code?: string;
    },
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'edit')) {
      throw new ForbiddenException();
    }
    await this.assertCustomerDirectoryAccess(req);
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
          body.first_name !== undefined
            ? body.first_name.trim() || null
            : undefined,
        lastName:
          body.last_name !== undefined
            ? body.last_name.trim() || null
            : undefined,
        email: email !== undefined ? email || null : undefined,
        phoneNumber:
          body.phone_number !== undefined
            ? body.phone_number.trim() || null
            : undefined,
        address:
          body.address !== undefined ? body.address.trim() || null : undefined,
        city: body.city !== undefined ? body.city.trim() || null : undefined,
        zipCode:
          body.zip_code !== undefined ? body.zip_code.trim() || null : undefined,
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
      phoneNumber: updated.phoneNumber,
      address: updated.address,
      city: updated.city,
      zipCode: updated.zipCode,
    };
  }
}
