import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';
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

@Controller('staff/settings')
@UseGuards(StaffAuthGuard)
export class StaffSettingsController {
  constructor(private readonly settings: SettingsService) {}

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
}
