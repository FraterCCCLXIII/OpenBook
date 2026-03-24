import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CustomerOtpService } from './customer-otp.service';
import { sendOtpCode } from '../jobs/email.service';
import { readAuthToken } from './read-auth-token';
import {
  CustomerAuthGuard,
  type RequestWithCustomer,
} from './customer-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly otp: CustomerOtpService,
  ) {}

  /** Double-submit CSRF token for SPA when `OPENBOOK_CSRF_ENABLED` is set (see ADR-004 / ADR-005). */
  @Get('csrf-token')
  issueCsrfToken(@Res({ passthrough: true }) res: Response) {
    const token = randomBytes(32).toString('hex');
    res.cookie('openbook_csrf', token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
    });
    return { csrfToken: token };
  }

  @Post('staff/login')
  async staffLogin(
    @Body() body: { username?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.username?.trim() || !body.password) {
      throw new BadRequestException('username and password are required');
    }
    const { token, user } = await this.auth.staffLogin(
      body.username.trim(),
      body.password,
    );
    res.cookie('ob_auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('customer/register')
  async customerRegister(
    @Body()
    body: {
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.customerRegister(
      body.email ?? '',
      body.password ?? '',
      body.first_name ?? '',
      body.last_name ?? '',
    );
    res.cookie('ob_auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('customer/login')
  async customerLogin(
    @Body() body: { email?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email?.trim() || !body.password) {
      throw new BadRequestException('email and password are required');
    }
    const { token, user } = await this.auth.customerLogin(
      body.email.trim(),
      body.password,
    );
    res.cookie('ob_auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('ob_auth', { path: '/' });
    return { ok: true };
  }

  @Post('customer/request-otp')
  async requestOtp(@Body() body: { email?: string }) {
    if (!body.email?.trim()) {
      throw new BadRequestException('email is required');
    }
    const email = body.email.trim();
    const code = await this.otp.requestCode(email);
    // Always send via Mailpit (dev) or real SMTP (prod). Return code only in dev for test convenience.
    await sendOtpCode(email, code).catch((err: unknown) => {
      // Non-fatal: log but don't block the response
      console.error('[OTP] email send failed:', err);
    });
    const isDev = process.env.NODE_ENV !== 'production';
    return { ok: true, ...(isDev ? { code } : {}) };
  }

  @Post('customer/verify-otp')
  async verifyOtp(
    @Body() body: { email?: string; code?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email?.trim() || !body.code?.trim()) {
      throw new BadRequestException('email and code are required');
    }
    await this.otp.verifyCode(body.email.trim(), body.code.trim());
    const { token, isNew } = await this.auth.customerOtpLogin(body.email.trim());
    res.cookie('ob_auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — full session
    });
    return { ok: true, isNew };
  }

  @Post('customer/create-password')
  async createPassword(
    @Body() body: { email?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email?.trim() || !body.password) {
      throw new BadRequestException('email and password are required');
    }
    const { token, user } = await this.auth.customerCreatePassword(
      body.email.trim(),
      body.password,
    );
    res.cookie('ob_auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('customer/change-password')
  @UseGuards(CustomerAuthGuard)
  async changePassword(
    @Req() req: RequestWithCustomer,
    @Body() body: { new_password?: string },
  ) {
    if (!body.new_password) {
      throw new BadRequestException('new_password is required');
    }
    await this.auth.customerChangePassword(
      BigInt(req.customerUser.customerId),
      body.new_password,
    );
    return { ok: true };
  }

  @Post('customer/change-email')
  @UseGuards(CustomerAuthGuard)
  async changeEmail(
    @Req() req: RequestWithCustomer,
    @Body() body: { new_email?: string },
  ) {
    if (!body.new_email?.trim()) {
      throw new BadRequestException('new_email is required');
    }
    await this.auth.customerChangeEmail(
      BigInt(req.customerUser.customerId),
      body.new_email.trim(),
    );
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = readAuthToken(req);
    if (!token) {
      return { user: null };
    }
    try {
      const payload = await this.auth.verifyToken(token);
      if (payload.kind === 'staff') {
        const user = await this.auth.meStaff(BigInt(payload.userId));
        return { user: user ?? null };
      }
      if (payload.kind === 'customer') {
        const user = await this.auth.meCustomer(BigInt(payload.customerId));
        return { user: user ?? null };
      }
      return { user: null };
    } catch {
      return { user: null };
    }
  }
}
