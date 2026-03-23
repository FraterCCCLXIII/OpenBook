import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Parity with Easy!Appointments API Bearer token (setting `api_token`).
 * Set OPENBOOK_API_TOKEN in env to match installation setting.
 */
@Injectable()
export class ApiV1TokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.OPENBOOK_API_TOKEN;
    if (!expected) {
      throw new UnauthorizedException(
        'OPENBOOK_API_TOKEN is not configured on this server',
      );
    }
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const token = auth.slice(7);
    if (token !== expected) {
      throw new UnauthorizedException('Invalid API token');
    }
    return true;
  }
}
