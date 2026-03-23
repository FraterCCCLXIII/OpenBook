import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SALT = 'testsalt';
// Pre-computed hash via hashPasswordEa used in seed.ts
// We'll just mock the credential check; unit tests don't need real DB.
function mockPrisma() {
  return {
    userSettings: { findFirst: jest.fn() },
    setting: { findFirst: jest.fn() },
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    customerAuth: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: { findFirst: jest.fn() },
  };
}

// ─── LDAP mock ───────────────────────────────────────────────────────────────

jest.mock('ldapjs', () => {
  const bindSucceeds = jest.fn(
    (_dn: string, _pwd: string, cb: (err: null | Error) => void) => cb(null),
  );
  const client = {
    bind: bindSucceeds,
    destroy: jest.fn(),
    on: jest.fn(),
  };
  return {
    createClient: jest.fn(() => client),
    __mockBind: bindSucceeds,
  };
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('mock-jwt') },
        },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('ldapBind', () => {
    it('returns false when ldap_is_active is not 1', async () => {
      prisma.setting.findFirst.mockResolvedValue({ value: '0' });
      const result = await service.ldapBind('user@example.com', 'pass');
      expect(result).toBe(false);
    });

    it('returns false when ldap_is_active setting is missing', async () => {
      prisma.setting.findFirst.mockResolvedValue(null);
      const result = await service.ldapBind('user@example.com', 'pass');
      expect(result).toBe(false);
    });

    it('returns true when ldap_is_active=1 and bind succeeds', async () => {
      // First call: ldap_is_active, then 6 setting fetches (host, port, username, password, base_dn, uid_field)
      prisma.setting.findFirst
        .mockResolvedValueOnce({ value: '1' }) // ldap_is_active
        .mockResolvedValueOnce({ value: 'ldap.example.com' }) // ldap_host
        .mockResolvedValueOnce({ value: '389' }) // ldap_port
        .mockResolvedValueOnce(null) // ldap_username (no service bind)
        .mockResolvedValueOnce(null) // ldap_password
        .mockResolvedValueOnce({ value: 'dc=example,dc=com' }) // ldap_base_dn
        .mockResolvedValueOnce(null); // ldap_uid_field

      const result = await service.ldapBind('user@example.com', 'correct-pass');
      expect(result).toBe(true);
    });
  });

  describe('staffLogin', () => {
    it('throws UnauthorizedException when user not found', async () => {
      prisma.userSettings.findFirst.mockResolvedValue(null);
      await expect(service.staffLogin('nobody', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException on wrong password (non-LDAP)', async () => {
      prisma.setting.findFirst.mockResolvedValue({ value: '0' }); // ldap disabled
      prisma.userSettings.findFirst.mockResolvedValue({
        salt: SALT,
        password: 'wrong-hash',
        user: {
          email: 'a@b.com',
          role: {
            slug: 'admin',
            appointments: 15,
            customers: 15,
            services: 15,
            usersPerm: 15,
            systemSettings: 15,
            userSettings: 15,
            webhooks: 15,
            blockedPeriods: 15,
          },
        },
      });
      await expect(service.staffLogin('admin', 'badpass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
