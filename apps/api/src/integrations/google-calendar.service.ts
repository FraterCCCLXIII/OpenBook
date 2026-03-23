import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type GoogleToken = {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
};

@Injectable()
export class GoogleCalendarService {
  private readonly log = new Logger(GoogleCalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  private ensureConfig() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)',
      );
    }
  }

  getAuthUrl(providerId: string): string {
    this.ensureConfig();
    const redirect = this.redirectUri();
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirect,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
      state: providerId,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string, providerId: string): Promise<void> {
    this.ensureConfig();
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: this.redirectUri(),
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new ServiceUnavailableException(
        `Google token exchange failed: ${text}`,
      );
    }
    const token = (await res.json()) as GoogleToken;
    const settings = await this.prisma.userSettings.findFirst({
      where: { idUsers: BigInt(providerId) },
    });
    if (!settings) {
      throw new ServiceUnavailableException('Provider not found');
    }
    await this.prisma.userSettings.update({
      where: { idUsers: BigInt(providerId) },
      data: {
        googleToken: JSON.stringify(token),
        googleSync: 1,
      },
    });
  }

  async syncProviderCalendar(providerId: bigint): Promise<void> {
    const settings = await this.prisma.userSettings.findFirst({
      where: { idUsers: providerId },
    });
    if (!settings?.googleToken || !settings.googleSync) {
      return;
    }
    let token: GoogleToken;
    try {
      token = JSON.parse(settings.googleToken) as GoogleToken;
    } catch {
      return;
    }

    // Refresh token if expired
    if (token.expiry_date && token.expiry_date < Date.now() + 60_000) {
      if (token.refresh_token) {
        token = await this.refreshToken(token);
        await this.prisma.userSettings.update({
          where: { idUsers: providerId },
          data: { googleToken: JSON.stringify(token) },
        });
      }
    }

    const calendarId = settings.googleCalendar ?? 'primary';
    const pastDays = settings.syncPastDays ?? 7;
    const futureDays = settings.syncFutureDays ?? 30;

    const from = new Date(Date.now() - pastDays * 86_400_000);
    const to = new Date(Date.now() + futureDays * 86_400_000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        idUsersProvider: providerId,
        isUnavailability: 0,
        startDatetime: { gte: from, lte: to },
      },
      include: {
        service: true,
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    for (const appt of appointments) {
      if (!appt.startDatetime || !appt.endDatetime) continue;
      const summary =
        appt.service?.name ??
        [appt.customer?.firstName, appt.customer?.lastName]
          .filter(Boolean)
          .join(' ') ??
        'Appointment';
      const event = {
        summary,
        start: { dateTime: appt.startDatetime.toISOString() },
        end: { dateTime: appt.endDatetime.toISOString() },
        description: appt.notes ?? undefined,
      };

      try {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          },
        );
      } catch (err) {
        this.log.warn(
          `Failed to push appointment ${appt.id} to Google Calendar: ${String(err)}`,
        );
      }
    }

    this.log.log(
      `Google Calendar sync: pushed ${appointments.length} appointments for provider ${providerId}`,
    );
  }

  async syncAllProviders(): Promise<void> {
    const providers = await this.prisma.userSettings.findMany({
      where: { googleSync: 1, googleToken: { not: null } },
    });
    for (const p of providers) {
      try {
        await this.syncProviderCalendar(p.idUsers);
      } catch (err) {
        this.log.warn(
          `Google Calendar sync failed for provider ${p.idUsers}: ${String(err)}`,
        );
      }
    }
  }

  private async refreshToken(token: GoogleToken): Promise<GoogleToken> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: token.refresh_token!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }).toString(),
    });
    if (!res.ok) throw new Error('Failed to refresh Google token');
    const refreshed = (await res.json()) as GoogleToken;
    return { ...token, ...refreshed };
  }

  async getConnectionStatus(
    providerId: bigint,
  ): Promise<{ connected: boolean; calendarId: string | null }> {
    const settings = await this.prisma.userSettings.findFirst({
      where: { idUsers: providerId },
    });
    return {
      connected: Boolean(settings?.googleToken && settings.googleSync),
      calendarId: settings?.googleCalendar ?? null,
    };
  }

  async disconnect(providerId: bigint): Promise<void> {
    await this.prisma.userSettings.updateMany({
      where: { idUsers: providerId },
      data: { googleToken: null, googleSync: 0 },
    });
  }

  private redirectUri(): string {
    return `${process.env.APP_URL ?? 'http://localhost:3000'}/api/integrations/google/callback`;
  }
}
