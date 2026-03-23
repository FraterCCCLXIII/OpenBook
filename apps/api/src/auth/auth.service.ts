import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { hashPasswordEa } from './password.ea';
import {
  normalizePermissionsMap,
  permissionsFromRoleRow,
  type PermissionsMap,
} from './permissions.ea';

export type StaffJwtPayload = {
  kind: 'staff';
  userId: string;
  roleSlug: string;
};

export type CustomerJwtPayload = {
  kind: 'customer';
  customerId: string;
  email: string;
};

export type AuthJwtPayload = StaffJwtPayload | CustomerJwtPayload;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private ensureDb() {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException('DATABASE_URL is not configured');
    }
  }

  async staffLogin(
    username: string,
    password: string,
  ): Promise<{ token: string; user: StaffMeResponse }> {
    this.ensureDb();
    const settings = await this.prisma.userSettings.findFirst({
      where: { username },
      include: { user: { include: { role: true } } },
    });
    if (!settings?.salt || !settings.password || !settings.user?.role?.slug) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const hashed = hashPasswordEa(settings.salt, password);
    if (hashed !== settings.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = settings.user;
    const role = user.role;
    const row = {
      appointments: role.appointments,
      customers: role.customers,
      services: role.services,
      users: role.usersPerm,
      system_settings: role.systemSettings,
      user_settings: role.userSettings,
      webhooks: role.webhooks,
      blocked_periods: role.blockedPeriods,
    };
    const permissions = normalizePermissionsMap(permissionsFromRoleRow(row));
    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      username;

    const payload: StaffJwtPayload = {
      kind: 'staff',
      userId: user.id.toString(),
      roleSlug: role.slug ?? '',
    };
    const token = await this.jwt.signAsync({ ...payload });

    return {
      token,
      user: {
        kind: 'staff' as const,
        userId: user.id.toString(),
        username,
        displayName,
        roleSlug: role.slug ?? '',
        permissions,
      },
    };
  }

  async customerRegister(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<{ token: string; user: CustomerMeResponse }> {
    this.ensureDb();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password || password.length < 6) {
      throw new BadRequestException('Valid email and password (min 6 chars) required');
    }
    const existing = await this.prisma.customerAuth.findFirst({
      where: { email: normalized },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    if (!customerRole) {
      throw new ServiceUnavailableException('Customer role not seeded');
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        email: normalized,
        idRoles: customerRole.id,
        timezone: 'UTC',
        customerAuth: {
          create: {
            email: normalized,
            passwordHash: hash,
            status: 'active',
          },
        },
      },
    });
    const payload: CustomerJwtPayload = {
      kind: 'customer',
      customerId: user.id.toString(),
      email: normalized,
    };
    const token = await this.jwt.signAsync({ ...payload });
    return {
      token,
      user: {
        kind: 'customer',
        customerId: user.id.toString(),
        email: normalized,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async customerLogin(
    email: string,
    password: string,
  ): Promise<{ token: string; user: CustomerMeResponse }> {
    this.ensureDb();
    const normalized = email.trim().toLowerCase();
    const auth = await this.prisma.customerAuth.findFirst({
      where: { email: normalized },
    });
    if (!auth?.passwordHash || auth.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, auth.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: CustomerJwtPayload = {
      kind: 'customer',
      customerId: auth.customerId.toString(),
      email: auth.email,
    };
    const token = await this.jwt.signAsync({ ...payload });

    const u = await this.prisma.user.findUnique({
      where: { id: auth.customerId },
    });
    return {
      token,
      user: {
        kind: 'customer' as const,
        customerId: auth.customerId.toString(),
        email: auth.email,
        firstName: u?.firstName ?? null,
        lastName: u?.lastName ?? null,
      },
    };
  }

  async verifyToken(token: string): Promise<AuthJwtPayload> {
    return this.jwt.verifyAsync<AuthJwtPayload>(token);
  }

  async meStaff(userId: bigint): Promise<StaffMeResponse | null> {
    this.ensureDb();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, userSettings: true },
    });
    if (!user?.role || !user.userSettings?.username) {
      return null;
    }
    const role = user.role;
    const row = {
      appointments: role.appointments,
      customers: role.customers,
      services: role.services,
      users: role.usersPerm,
      system_settings: role.systemSettings,
      user_settings: role.userSettings,
      webhooks: role.webhooks,
      blocked_periods: role.blockedPeriods,
    };
    const permissions = normalizePermissionsMap(permissionsFromRoleRow(row));
    const displayName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return {
      kind: 'staff',
      userId: user.id.toString(),
      username: user.userSettings.username,
      displayName: displayName || user.userSettings.username,
      roleSlug: role.slug ?? '',
      permissions,
    };
  }

  async meCustomer(customerId: bigint): Promise<CustomerMeResponse | null> {
    this.ensureDb();
    const auth = await this.prisma.customerAuth.findFirst({
      where: { customerId, status: 'active' },
    });
    if (!auth) {
      return null;
    }
    const u = await this.prisma.user.findUnique({
      where: { id: customerId },
    });
    return {
      kind: 'customer',
      customerId: auth.customerId.toString(),
      email: auth.email,
      firstName: u?.firstName ?? null,
      lastName: u?.lastName ?? null,
    };
  }

  async updateCustomerProfile(
    customerId: bigint,
    body: { firstName?: string; lastName?: string },
  ) {
    this.ensureDb();
    const auth = await this.prisma.customerAuth.findFirst({
      where: { customerId, status: 'active' },
    });
    if (!auth) {
      throw new UnauthorizedException();
    }
    const user = await this.prisma.user.update({
      where: { id: customerId },
      data: {
        firstName:
          body.firstName !== undefined ? body.firstName.trim() || null : undefined,
        lastName:
          body.lastName !== undefined ? body.lastName.trim() || null : undefined,
      },
    });
    return {
      customerId: user.id.toString(),
      email: auth.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}

export type StaffMeResponse = {
  kind: 'staff';
  userId: string;
  username: string;
  displayName: string;
  roleSlug: string;
  permissions: PermissionsMap;
};

export type CustomerMeResponse = {
  kind: 'customer';
  customerId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};
