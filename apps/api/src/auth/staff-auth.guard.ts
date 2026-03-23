import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type StaffMeResponse } from './auth.service';
import { readAuthToken } from './read-auth-token';

export type RequestWithStaff = Request & { staffUser: StaffMeResponse };

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithStaff>();
    const token = readAuthToken(req);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.auth.verifyToken(token);
      if (payload.kind !== 'staff') {
        throw new UnauthorizedException();
      }
      const user = await this.auth.meStaff(BigInt(payload.userId));
      if (!user) {
        throw new UnauthorizedException();
      }
      req.staffUser = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
