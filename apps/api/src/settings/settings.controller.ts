import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';
import { PrismaService } from '../prisma/prisma.service';
import { getMailTransportAndFrom } from '../jobs/email-transport';
import { SettingsService } from './settings.service';
import { SETTINGS_SECTION_SCHEMAS } from '@openbook/shared';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  getPublic() {
    return this.settings.getPublicSettings();
  }

  @Get('legal')
  getLegalPublic() {
    return this.settings.getLegalPublicSettings();
  }
}

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Controller('staff/settings')
@UseGuards(StaffAuthGuard)
export class StaffSettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  list(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    return this.settings.listAllForStaff();
  }

  /** Generic single-key patch — kept for backward compat with existing UI. */
  @Patch()
  patch(
    @Req() req: RequestWithStaff,
    @Body() body: { name?: string; value?: string },
  ) {
    if (!body.name?.trim()) {
      throw new BadRequestException('name is required');
    }
    return this.settings.patchSetting(
      req.staffUser.permissions,
      body.name.trim(),
      body.value ?? '',
    );
  }

  /** Section-level PATCH — validates entire section payload against Zod schema. */
  @Patch('section/:section')
  async patchSection(
    @Req() req: RequestWithStaff,
    @Param('section') section: string,
    @Body() body: Record<string, string>,
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    const schema =
      SETTINGS_SECTION_SCHEMAS[
        section as keyof typeof SETTINGS_SECTION_SCHEMAS
      ];
    if (!schema) {
      throw new BadRequestException(`Unknown settings section: ${section}`);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    const results: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(
      parsed.data as Record<string, unknown>,
    )) {
      if (value !== undefined) {
        const result = await this.settings.patchSetting(
          req.staffUser.permissions,
          key,
          String(value as string),
        );
        results[key] = result.value;
      }
    }
    return { ok: true, updated: results };
  }

  /** Get all settings for a section (keys filtered). */
  @Get('section/:section')
  async getSection(
    @Req() req: RequestWithStaff,
    @Param('section') section: string,
  ) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    const schema =
      SETTINGS_SECTION_SCHEMAS[
        section as keyof typeof SETTINGS_SECTION_SCHEMAS
      ];
    if (!schema) {
      throw new BadRequestException(`Unknown settings section: ${section}`);
    }
    const keys = Object.keys(schema.shape);
    return this.settings.getSettingsByNames(keys);
  }

  /** Push global `company_working_plan` to all provider accounts. */
  @Post('apply-global-working-plan')
  async applyGlobalWorkingPlan(@Req() req: RequestWithStaff) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    return this.settings.applyCompanyWorkingPlanToAllProviders();
  }

  /** Send a test message using SMTP + From from saved settings (and env fallbacks). Save the form first if you changed SMTP. */
  @Post('test-email')
  async sendTestEmail(
    @Req() req: RequestWithStaff,
    @Body() body: { to?: string },
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    let recipient = body.to?.trim() ?? '';
    if (!recipient) {
      const uid = BigInt(req.staffUser.userId);
      const user = await this.prisma.user.findUnique({
        where: { id: uid },
        select: { email: true },
      });
      recipient = user?.email?.trim() ?? '';
    }
    if (!recipient || !SIMPLE_EMAIL_RE.test(recipient)) {
      throw new BadRequestException(
        'Enter a valid recipient address, or save your email on your staff profile.',
      );
    }
    const companyName =
      (await this.settings.getSettingByName('company_name'))?.trim() ||
      'OpenBook';
    const { transport, from } = await getMailTransportAndFrom(
      this.prisma,
      companyName,
    );
    await transport.sendMail({
      from,
      to: recipient,
      subject: `${companyName}: test email`,
      text:
        'This is a test message from OpenBook. If you received this, SMTP is configured correctly.',
      html: `<p>This is a test message from <strong>${escapeHtml(
        companyName,
      )}</strong>.</p><p>If you received this, SMTP is configured correctly.</p>`,
    });
    return { ok: true as const, sentTo: recipient };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
