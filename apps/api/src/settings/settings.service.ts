import {
  BadRequestException,
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
  'company_color',
  'theme',
  'date_format',
  'time_format',
  'default_language',
  'default_timezone',
  'require_phone_number',
  'require_notes',
  'require_first_name',
  'require_last_name',
  'require_address',
  'display_first_name',
  'display_last_name',
  'display_email',
  'display_phone_number',
  'display_address',
  'display_city',
  'display_zip_code',
  'display_notes',
  'display_timezone',
  'display_language_selector',
  'display_login_button',
  'disable_booking',
  'disable_booking_message',
  'customer_login_enabled',
  'customer_login_mode',
  'allow_guest_booking',
  /** Public booking step; paired with env `OPENBOOK_TURNSTILE_SITE_KEY` for the widget. */
  'require_captcha',
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
    const siteKey = process.env.OPENBOOK_TURNSTILE_SITE_KEY?.trim();
    if (siteKey) {
      out.turnstile_site_key = siteKey;
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

  /** When true, anonymous and customer self-service booking must be rejected. */
  async isPublicBookingDisabled(): Promise<boolean> {
    const v = await this.getSettingByName('disable_booking');
    return v === '1';
  }

  /** When true, customer login, registration, and portal routes are allowed. */
  async isCustomerPortalEnabled(): Promise<boolean> {
    const v = await this.getSettingByName('customer_login_enabled');
    return v === '1';
  }

  /** When false, `POST /booking/appointments` requires a signed-in customer session. */
  async isGuestBookingAllowed(): Promise<boolean> {
    const v = await this.getSettingByName('allow_guest_booking');
    return v !== '0';
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

  /**
   * Copy `company_working_plan` from global settings to every provider's `ea_user_settings.working_plan`.
   */
  async applyCompanyWorkingPlanToAllProviders(): Promise<{ updated: number }> {
    const plan = await this.getSettingByName('company_working_plan');
    if (!plan?.trim()) {
      throw new BadRequestException('company_working_plan is empty; save Business settings first.');
    }
    try {
      JSON.parse(plan);
    } catch {
      throw new BadRequestException('company_working_plan must be valid JSON');
    }
    const providerRole = await this.prisma.role.findFirst({
      where: { slug: 'provider' },
    });
    if (!providerRole) {
      return { updated: 0 };
    }
    const providers = await this.prisma.user.findMany({
      where: { idRoles: providerRole.id },
      select: { id: true },
    });
    let updated = 0;
    for (const p of providers) {
      await this.prisma.userSettings.upsert({
        where: { idUsers: p.id },
        create: { idUsers: p.id, workingPlan: plan },
        update: { workingPlan: plan },
      });
      updated++;
    }
    return { updated };
  }
}
