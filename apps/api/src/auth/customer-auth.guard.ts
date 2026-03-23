import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type CustomerMeResponse } from './auth.service';
import { readAuthToken } from './read-auth-token';

export type RequestWithCustomer = Request & { customerUser: CustomerMeResponse };

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithCustomer>();
    const token = readAuthToken(req);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.auth.verifyToken(token);
      if (payload.kind !== 'customer') {
        throw new UnauthorizedException();
      }
      const user = await this.auth.meCustomer(BigInt(payload.customerId));
      if (!user) {
        throw new UnauthorizedException();
      }
      req.customerUser = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
