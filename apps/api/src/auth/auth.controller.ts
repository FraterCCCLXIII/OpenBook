import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { readAuthToken } from './read-auth-token';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
