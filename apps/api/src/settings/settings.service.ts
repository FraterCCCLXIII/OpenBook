import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LEGAL_PUBLIC_SETTING_NAMES } from '@openbook/shared';
import { PrismaService } from '../prisma/prisma.service';
import { canView, type PermissionsMap } from '../auth/permissions.ea';

/** Keys safe to expose to anonymous booking UI (no secrets). */
const PUBLIC_SETTING_NAMES = new Set([
  'company_name',
  'company_logo',
  'company_email',
  'company_link',
  'date_format',
  'time_format',
  'require_phone_number',
  'require_notes',
  'display_first_name',
  'display_last_name',
  'display_email',
  'display_phone_number',
  'display_address',
  'display_city',
  'display_zip_code',
  'display_notes',
  'display_timezone',
]);

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSettings(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany({
      where: { name: { in: [...PUBLIC_SETTING_NAMES] } },
    });
    const out: Record<string, string> = {};
    for (const r of rows) {
      if (r.name && r.value !== null && PUBLIC_SETTING_NAMES.has(r.name)) {
        out[r.name] = r.value;
      }
    }
    return out;
  }

  /** Terms / privacy / cookie copy for customer consents UX (no secrets). */
  async getLegalPublicSettings(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany({
      where: { name: { in: [...LEGAL_PUBLIC_SETTING_NAMES] } },
    });
    const out: Record<string, string> = {};
    for (const r of rows) {
      if (r.name && r.value !== null && LEGAL_PUBLIC_SETTING_NAMES.has(r.name)) {
        out[r.name] = r.value;
      }
    }
    return out;
  }

  async listAllForStaff(): Promise<{ name: string; value: string | null }[]> {
    const rows = await this.prisma.setting.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => ({ name: r.name ?? '', value: r.value }));
  }

  async patchSetting(
    perms: PermissionsMap,
    name: string,
    value: string,
  ): Promise<{ name: string; value: string | null }> {
    if (!canView(perms, 'system_settings')) {
      throw new ForbiddenException();
    }
    const existing = await this.prisma.setting.findFirst({ where: { name } });
    if (existing) {
      const updated = await this.prisma.setting.update({
        where: { id: existing.id },
        data: { value },
      });
      return { name: updated.name ?? name, value: updated.value };
    }
    const created = await this.prisma.setting.create({
      data: { name, value },
    });
    return { name: created.name ?? name, value: created.value };
  }

  async getSettingByName(name: string): Promise<string | null> {
    const row = await this.prisma.setting.findFirst({ where: { name } });
    return row?.value ?? null;
  }

  async getSettingsByNames(
    names: string[],
  ): Promise<Record<string, string | null>> {
    const rows = await this.prisma.setting.findMany({
      where: { name: { in: names } },
    });
    const out: Record<string, string | null> = {};
    for (const name of names) {
      const row = rows.find((r) => r.name === name);
      out[name] = row?.value ?? null;
    }
    return out;
  }

  async requireSettingForStaff(
    perms: PermissionsMap,
    name: string,
  ): Promise<string | null> {
    if (!canView(perms, 'system_settings')) {
      throw new ForbiddenException();
    }
    const row = await this.prisma.setting.findFirst({ where: { name } });
    if (!row) {
      throw new NotFoundException('Setting not found');
    }
    return row.value;
  }
}
