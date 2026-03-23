import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { GoogleCalendarService } from './google-calendar.service';

@Controller('integrations/google')
export class GoogleCalendarController {
  constructor(private readonly google: GoogleCalendarService) {}

  /** Redirect provider to Google OAuth consent screen. */
  @Get('auth')
  @UseGuards(StaffAuthGuard)
  @Redirect()
  authRedirect(@Req() req: RequestWithStaff) {
    const url = this.google.getAuthUrl(req.staffUser.userId);
    return { url };
  }

  /** Google OAuth callback — exchange code for token and store it. */
  @Get('callback')
  async callback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      throw new BadRequestException(`Google OAuth error: ${error}`);
    }
    if (!code || !state) {
      throw new BadRequestException('code and state are required');
    }
    await this.google.handleCallback(code, state);
    return { ok: true, message: 'Google Calendar connected successfully.' };
  }

  /** Manually trigger sync for the authenticated provider. */
  @Post('sync')
  @UseGuards(StaffAuthGuard)
  async sync(@Req() req: RequestWithStaff) {
    await this.google.syncProviderCalendar(BigInt(req.staffUser.userId));
    return { ok: true };
  }

  /** Return connection status for the authenticated provider. */
  @Get('status')
  @UseGuards(StaffAuthGuard)
  async status(@Req() req: RequestWithStaff) {
    return this.google.getConnectionStatus(BigInt(req.staffUser.userId));
  }

  /** Disconnect Google Calendar for the authenticated provider. */
  @Delete('disconnect')
  @UseGuards(StaffAuthGuard)
  async disconnect(@Req() req: RequestWithStaff) {
    await this.google.disconnect(BigInt(req.staffUser.userId));
    return { ok: true };
  }
}
