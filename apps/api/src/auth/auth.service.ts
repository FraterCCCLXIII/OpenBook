import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as ldap from 'ldapjs';
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

  /**
   * Attempt LDAP bind for the given email and password.
   * Returns true if bind succeeded, false if credentials are wrong or LDAP is
   * unreachable (caller falls back to bcrypt).
   *
   * If `ldap_user_search_filter` is set (e.g. `(mail=${email})`), performs a
   * search under `ldap_base_dn` after service bind, then binds as the found DN.
   */
  async ldapBind(email: string, password: string): Promise<boolean> {
    const settings = await this.prisma.setting.findFirst({
      where: { name: 'ldap_is_active' },
    });
    if (settings?.value !== '1') return false;

    const [
      host,
      portSetting,
      bindDN,
      bindPassword,
      baseDN,
      uidField,
      searchFilterSetting,
      tlsSetting,
    ] = await Promise.all([
      this.prisma.setting.findFirst({ where: { name: 'ldap_host' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_port' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_username' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_password' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_base_dn' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_uid_field' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_user_search_filter' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_tls' } }),
    ]);

    const ldapHost = host?.value ?? 'localhost';
    const ldapPort = Number(portSetting?.value ?? 389);
    const ldapBaseDN = baseDN?.value ?? '';
    const uidAttr = uidField?.value ?? 'uid';
    const useTls = tlsSetting?.value === '1';
    const url = useTls
      ? `ldaps://${ldapHost}:${ldapPort}`
      : `ldap://${ldapHost}:${ldapPort}`;

    const searchTpl = searchFilterSetting?.value?.trim();
    if (searchTpl) {
      const filter = searchTpl.replace(
        /\$\{email\}/g,
        escapeLdapFilterValue(email),
      );
      const userDN = await this.ldapSearchFirstDN(
        url,
        bindDN?.value ?? undefined,
        bindPassword?.value ?? undefined,
        ldapBaseDN,
        filter,
      );
      if (!userDN) return false;
      return this.ldapBindSingle(url, userDN, password);
    }

    const userDN = `${uidAttr}=${escapeLdapRdnValue(email)},${ldapBaseDN}`;
    return new Promise<boolean>((resolve) => {
      const client = ldap.createClient({
        url,
        connectTimeout: 5000,
        timeout: 8000,
      });

      const doUserBind = () => {
        client.bind(userDN, password, (err) => {
          try {
            client.destroy();
          } catch {
            /* ignore */
          }
          resolve(!err);
        });
      };

      if (bindDN?.value && bindPassword?.value) {
        client.bind(bindDN.value, bindPassword.value, (err) => {
          if (err) {
            try {
              client.destroy();
            } catch {
              /* ignore */
            }
            resolve(false);
            return;
          }
          doUserBind();
        });
      } else {
        doUserBind();
      }

      client.on('error', () => {
        try {
          client.destroy();
        } catch {
          /* ignore */
        }
        resolve(false);
      });
    });
  }

  private ldapSearchFirstDN(
    url: string,
    serviceBindDN: string | undefined,
    servicePassword: string | undefined,
    baseDN: string,
    filter: string,
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const client = ldap.createClient({
        url,
        connectTimeout: 5000,
        timeout: 8000,
      });

      const finish = (dn: string | null) => {
        try {
          client.destroy();
        } catch {
          /* ignore */
        }
        resolve(dn);
      };

      const runSearch = () => {
        client.search(
          baseDN,
          { filter, scope: 'sub', attributes: ['dn'] },
          (err, res) => {
            if (err || !res) {
              finish(null);
              return;
            }
            let dn: string | null = null;
            res.on('searchEntry', (entry) => {
              if (!dn) {
                const raw = entry.dn as unknown;
                dn = typeof raw === 'string' ? raw : String(raw);
              }
            });
            res.on('error', () => finish(null));
            res.on('end', () => finish(dn));
          },
        );
      };

      if (serviceBindDN && servicePassword) {
        client.bind(serviceBindDN, servicePassword, (err) => {
          if (err) {
            finish(null);
            return;
          }
          runSearch();
        });
      } else {
        runSearch();
      }

      client.on('error', () => finish(null));
    });
  }

  private ldapBindSingle(
    url: string,
    userDN: string,
    password: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const client = ldap.createClient({
        url,
        connectTimeout: 5000,
        timeout: 8000,
      });
      client.bind(userDN, password, (err) => {
        try {
          client.destroy();
        } catch {
          /* ignore */
        }
        resolve(!err);
      });
      client.on('error', () => resolve(false));
    });
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
    if (!settings?.user?.role?.slug) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // LDAP auth path: use the user's email as the LDAP UID
    const userEmail = settings.user.email ?? username;
    const usedLdap = await this.ldapBind(userEmail, password);

    if (!usedLdap) {
      // Fall back to EA bcrypt check
      if (!settings.salt || !settings.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const hashed = hashPasswordEa(settings.salt, password);
      if (hashed !== settings.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
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
      throw new BadRequestException(
        'Valid email and password (min 6 chars) required',
      );
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
        phoneNumber: user.phoneNumber,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        timezone: user.timezone,
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
        phoneNumber: u?.phoneNumber ?? null,
        address: u?.address ?? null,
        city: u?.city ?? null,
        state: u?.state ?? null,
        zipCode: u?.zipCode ?? null,
        timezone: u?.timezone ?? null,
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
      phoneNumber: u?.phoneNumber ?? null,
      address: u?.address ?? null,
      city: u?.city ?? null,
      state: u?.state ?? null,
      zipCode: u?.zipCode ?? null,
      timezone: u?.timezone ?? null,
    };
  }

  async updateCustomerProfile(
    customerId: bigint,
    body: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      timezone?: string;
    },
  ) {
    this.ensureDb();
    const auth = await this.prisma.customerAuth.findFirst({
      where: { customerId, status: 'active' },
    });
    if (!auth) {
      throw new UnauthorizedException();
    }
    const trim = (v?: string) =>
      v !== undefined ? v.trim() || null : undefined;
    const user = await this.prisma.user.update({
      where: { id: customerId },
      data: {
        firstName: trim(body.firstName),
        lastName: trim(body.lastName),
        phoneNumber: trim(body.phoneNumber),
        address: trim(body.address),
        city: trim(body.city),
        state: trim(body.state),
        zipCode: trim(body.zipCode),
        timezone: trim(body.timezone),
      },
    });
    return {
      customerId: user.id.toString(),
      email: auth.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      timezone: user.timezone,
    };
  }

  /**
   * OTP login: finds or auto-creates a customer account for the verified email,
   * then issues a full 7-day session token.
   * Used by the OTP login flow (passwordless).
   */
  async customerOtpLogin(
    email: string,
  ): Promise<{ token: string; user: CustomerMeResponse; isNew: boolean }> {
    this.ensureDb();
    const normalized = email.trim().toLowerCase();

    let auth = await this.prisma.customerAuth.findFirst({
      where: { email: normalized },
    });

    let isNew = false;

    if (!auth) {
      isNew = true;
      const customerRole = await this.prisma.role.findFirst({
        where: { slug: 'customer' },
      });
      if (!customerRole) {
        throw new ServiceUnavailableException('Customer role not seeded');
      }
      const user = await this.prisma.user.create({
        data: {
          email: normalized,
          firstName: null,
          lastName: null,
          idRoles: customerRole.id,
          timezone: 'UTC',
          customerAuth: {
            create: {
              email: normalized,
              passwordHash: null,
              status: 'active',
            },
          },
        },
      });
      auth = await this.prisma.customerAuth.findFirst({
        where: { customerId: user.id },
      });
    }

    if (!auth || auth.status !== 'active') {
      throw new UnauthorizedException('Account is inactive');
    }

    const u = await this.prisma.user.findUnique({
      where: { id: auth.customerId },
    });

    const payload: CustomerJwtPayload = {
      kind: 'customer',
      customerId: auth.customerId.toString(),
      email: auth.email,
    };
    const token = await this.jwt.signAsync({ ...payload });

    return {
      token,
      isNew,
      user: {
        kind: 'customer',
        customerId: auth.customerId.toString(),
        email: auth.email,
        firstName: u?.firstName ?? null,
        lastName: u?.lastName ?? null,
        phoneNumber: u?.phoneNumber ?? null,
        address: u?.address ?? null,
        city: u?.city ?? null,
        state: u?.state ?? null,
        zipCode: u?.zipCode ?? null,
        timezone: u?.timezone ?? null,
      },
    };
  }

  /** Issue a short-lived JWT after OTP verification for password-reset flows only. */
  async issueOtpSessionToken(email: string): Promise<string> {
    this.ensureDb();
    const normalized = email.trim().toLowerCase();
    const auth = await this.prisma.customerAuth.findFirst({
      where: { email: normalized },
    });
    if (!auth) {
      throw new BadRequestException('No account found for this email');
    }
    const payload: CustomerJwtPayload = {
      kind: 'customer',
      customerId: auth.customerId.toString(),
      email: auth.email,
    };
    return this.jwt.signAsync({ ...payload }, { expiresIn: '15m' });
  }

  /** Set password for the first time (no existing password required). */
  async customerCreatePassword(
    email: string,
    password: string,
  ): Promise<{ token: string; user: CustomerMeResponse }> {
    this.ensureDb();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password || password.length < 6) {
      throw new BadRequestException(
        'Valid email and password (min 6 chars) required',
      );
    }
    const auth = await this.prisma.customerAuth.findFirst({
      where: { email: normalized },
    });
    if (!auth) {
      throw new BadRequestException('No account found for this email');
    }
    if (auth.passwordHash) {
      throw new BadRequestException(
        'Password already set. Use change-password instead.',
      );
    }
    const hash = await bcrypt.hash(password, 10);
    await this.prisma.customerAuth.update({
      where: { id: auth.id },
      data: { passwordHash: hash, status: 'active' },
    });
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
        kind: 'customer',
        customerId: auth.customerId.toString(),
        email: auth.email,
        firstName: u?.firstName ?? null,
        lastName: u?.lastName ?? null,
        phoneNumber: u?.phoneNumber ?? null,
        address: u?.address ?? null,
        city: u?.city ?? null,
        state: u?.state ?? null,
        zipCode: u?.zipCode ?? null,
        timezone: u?.timezone ?? null,
      },
    };
  }

  /** Change password after OTP verification. */
  async customerChangePassword(
    customerId: bigint,
    newPassword: string,
  ): Promise<void> {
    this.ensureDb();
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const auth = await this.prisma.customerAuth.findFirst({
      where: { customerId, status: 'active' },
    });
    if (!auth) {
      throw new UnauthorizedException();
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.customerAuth.update({
      where: { id: auth.id },
      data: { passwordHash: hash },
    });
  }

  /** Change email after OTP verification on the old address. */
  async customerChangeEmail(
    customerId: bigint,
    newEmail: string,
  ): Promise<void> {
    this.ensureDb();
    const normalized = newEmail.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('Valid email required');
    }
    const existing = await this.prisma.customerAuth.findFirst({
      where: { email: normalized },
    });
    if (existing && existing.customerId !== customerId) {
      throw new ConflictException('Email already in use');
    }
    const auth = await this.prisma.customerAuth.findFirst({
      where: { customerId, status: 'active' },
    });
    if (!auth) {
      throw new UnauthorizedException();
    }
    await this.prisma.$transaction([
      this.prisma.customerAuth.update({
        where: { id: auth.id },
        data: { email: normalized },
      }),
      this.prisma.user.update({
        where: { id: customerId },
        data: { email: normalized },
      }),
    ]);
  }

  /**
   * Search LDAP for directory import (staff UI). Requires `ldap_is_active=1` and service bind credentials.
   */
  async ldapDirectorySearch(
    query: string,
  ): Promise<
    Array<{
      dn: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    }>
  > {
    this.ensureDb();
    const q = query.trim();
    if (q.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }

    const active = await this.prisma.setting.findFirst({
      where: { name: 'ldap_is_active' },
    });
    if (active?.value !== '1') {
      throw new ServiceUnavailableException('LDAP is not active');
    }

    const [
      host,
      portSetting,
      bindDN,
      bindPassword,
      baseDN,
      tlsSetting,
      filterTplSetting,
      mappingJson,
    ] = await Promise.all([
      this.prisma.setting.findFirst({ where: { name: 'ldap_host' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_port' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_username' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_password' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_base_dn' } }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_tls' } }),
      this.prisma.setting.findFirst({
        where: { name: 'ldap_directory_search_filter' },
      }),
      this.prisma.setting.findFirst({ where: { name: 'ldap_field_mapping' } }),
    ]);

    const ldapHost = host?.value ?? 'localhost';
    const ldapPort = Number(portSetting?.value ?? 389);
    const ldapBaseDN = baseDN?.value ?? '';
    const useTls = tlsSetting?.value === '1';
    const url = useTls
      ? `ldaps://${ldapHost}:${ldapPort}`
      : `ldap://${ldapHost}:${ldapPort}`;

    const filterTpl =
      filterTplSetting?.value?.trim() ||
      '(&(objectClass=inetOrgPerson)(mail=*${query}*))';
    const filter = filterTpl.replace(
      /\$\{query\}/g,
      escapeLdapFilterValue(q),
    );

    let mapping: Record<string, string> = {
      email: 'mail',
      firstName: 'givenName',
      lastName: 'sn',
    };
    try {
      if (mappingJson?.value?.trim()) {
        const parsed = JSON.parse(mappingJson.value) as Record<string, string>;
        if (parsed && typeof parsed === 'object') {
          mapping = { ...mapping, ...parsed };
        }
      }
    } catch {
      /* keep defaults */
    }

    const emailAttr = mapping.email ?? 'mail';
    const firstAttr = mapping.firstName ?? 'givenName';
    const lastAttr = mapping.lastName ?? 'sn';
    const attrs = Array.from(
      new Set([emailAttr, firstAttr, lastAttr, 'mail', 'userPrincipalName']),
    );

    const rows = await this.ldapSearchCollect(
      url,
      bindDN?.value ?? undefined,
      bindPassword?.value ?? undefined,
      ldapBaseDN,
      filter,
      attrs,
      25,
    );

    const out: Array<{
      dn: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    }> = [];

    const read = (attrs: Record<string, string[]>, name: string) => {
      const v = attrs[name]?.[0];
      return v?.trim() ? v.trim() : null;
    };

    for (const row of rows) {
      const emailRaw =
        read(row.attrs, emailAttr) ??
        read(row.attrs, 'mail') ??
        read(row.attrs, 'userPrincipalName');
      const email = emailRaw?.trim().toLowerCase() ?? '';
      if (!email) continue;
      out.push({
        dn: row.dn,
        email,
        firstName: read(row.attrs, firstAttr),
        lastName: read(row.attrs, lastAttr),
      });
    }
    return out;
  }

  /**
   * Create a customer account without a password (portal login uses OTP / set-password flow).
   */
  async importCustomerFromDirectory(
    email: string,
    firstName: string | null,
    lastName: string | null,
  ): Promise<'created' | 'duplicate'> {
    this.ensureDb();
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('Email is required');
    }
    const existing = await this.prisma.customerAuth.findFirst({
      where: { email: normalized },
    });
    if (existing) {
      return 'duplicate';
    }
    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    if (!customerRole) {
      throw new ServiceUnavailableException('Customer role not seeded');
    }
    await this.prisma.user.create({
      data: {
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        email: normalized,
        idRoles: customerRole.id,
        timezone: 'UTC',
        customerAuth: {
          create: {
            email: normalized,
            passwordHash: null,
            status: 'active',
          },
        },
      },
    });
    await this.prisma.auditLog.create({
      data: {
        action: 'ldap_customer_import',
        metadata: JSON.stringify({ email: normalized }),
      },
    });
    return 'created';
  }

  private ldapSearchCollect(
    url: string,
    serviceBindDN: string | undefined,
    servicePassword: string | undefined,
    baseDN: string,
    filter: string,
    attributes: string[],
    limit: number,
  ): Promise<Array<{ dn: string; attrs: Record<string, string[]> }>> {
    return new Promise((resolve) => {
      const client = ldap.createClient({
        url,
        connectTimeout: 5000,
        timeout: 15_000,
      });

      const rows: Array<{ dn: string; attrs: Record<string, string[]> }> = [];
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        try {
          client.destroy();
        } catch {
          /* ignore */
        }
        resolve(rows);
      };

      const runSearch = () => {
        client.search(
          baseDN,
          {
            filter,
            scope: 'sub',
            attributes,
            paged: false,
          },
          (err, res) => {
            if (err || !res) {
              finish();
              return;
            }
            res.on('searchEntry', (entry) => {
              if (rows.length >= limit) return;
              const dnRaw = entry.dn as unknown;
              const dn = typeof dnRaw === 'string' ? dnRaw : String(dnRaw);
              const attrs: Record<string, string[]> = {};
              for (const attr of entry.attributes) {
                const raw = attr.values;
                const arr = Array.isArray(raw)
                  ? raw
                  : raw != null
                    ? [raw]
                    : [];
                attrs[attr.type] = arr.map((v) => String(v));
              }
              rows.push({ dn, attrs });
            });
            res.on('error', () => finish());
            res.on('end', () => finish());
          },
        );
      };

      if (serviceBindDN && servicePassword) {
        client.bind(serviceBindDN, servicePassword, (err) => {
          if (err) {
            finish();
            return;
          }
          runSearch();
        });
      } else {
        runSearch();
      }

      client.on('error', () => finish());
    });
  }
}

function escapeLdapFilterValue(s: string): string {
  return s.replace(/[\\*()\0]/g, (ch) => {
    if (ch === '\0') return '\\00';
    return '\\' + ch;
  });
}

/** Escape RDN attribute value (RFC 4514 subset). */
function escapeLdapRdnValue(s: string): string {
  return s.replace(/[+,=\\<>#;\"\n]/g, (ch) => '\\' + ch);
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
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  timezone: string | null;
};
