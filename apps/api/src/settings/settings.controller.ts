import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  getPublic() {
    return this.settings.getPublicSettings();
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
}
