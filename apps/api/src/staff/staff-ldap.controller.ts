import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';

@Controller('staff/ldap')
@UseGuards(StaffAuthGuard)
export class StaffLdapController {
  constructor(private readonly auth: AuthService) {}

  @Get('search')
  async search(
    @Req() req: RequestWithStaff,
    @Query('q') q: string | undefined,
  ) {
    if (!canView(req.staffUser.permissions, 'customers')) {
      throw new ForbiddenException();
    }
    const items = await this.auth.ldapDirectorySearch(q ?? '');
    return { items };
  }

  @Post('import')
  async import(
    @Req() req: RequestWithStaff,
    @Body()
    body: {
      entries: Array<{
        email: string;
        firstName?: string | null;
        lastName?: string | null;
      }>;
    },
  ) {
    if (!can(req.staffUser.permissions, 'customers', 'add')) {
      throw new ForbiddenException();
    }
    const entries = Array.isArray(body.entries) ? body.entries : [];
    let created = 0;
    let skipped = 0;
    for (const e of entries) {
      const r = await this.auth.importCustomerFromDirectory(
        e.email,
        e.firstName ?? null,
        e.lastName ?? null,
      );
      if (r === 'created') created += 1;
      else skipped += 1;
    }
    return { ok: true, created, skipped };
  }
}
