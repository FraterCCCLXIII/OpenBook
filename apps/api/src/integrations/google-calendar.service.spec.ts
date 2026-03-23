import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GoogleCalendarService } from './google-calendar.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = () => ({
  userSettings: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  appointment: {
    findMany: jest.fn().mockResolvedValue([]),
  },
});

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  let prisma: ReturnType<typeof mockPrisma>;
  const originalEnv = process.env;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(GoogleCalendarService);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAuthUrl', () => {
    it('throws ServiceUnavailableException when env vars missing', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      expect(() => service.getAuthUrl('42')).toThrow(
        ServiceUnavailableException,
      );
    });

    it('returns a valid Google OAuth URL', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      const url = service.getAuthUrl('42');
      expect(url).toContain('accounts.google.com/o/oauth2');
      expect(url).toContain('test-client-id');
      expect(url).toContain('state=42');
      expect(url).toContain('scope=');
    });
  });

  describe('handleCallback', () => {
    it('stores token in userSettings after successful exchange', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      // Mock the global fetch for token exchange
      const mockToken = { access_token: 'ya29.test', refresh_token: 'refresh' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockToken),
      } as never);

      prisma.userSettings.findFirst.mockResolvedValue({
        idUsers: BigInt(42),
        googleToken: null,
      });
      prisma.userSettings.update.mockResolvedValue({});

      await service.handleCallback('auth-code', '42');

      expect(prisma.userSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            googleToken: JSON.stringify(mockToken),
            googleSync: 1,
          }),
        }),
      );
    });

    it('throws ServiceUnavailableException when token exchange fails', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        text: jest.fn().mockResolvedValue('error'),
      } as never);

      await expect(service.handleCallback('bad-code', '42')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
