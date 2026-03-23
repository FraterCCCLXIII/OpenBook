import { BadRequestException, HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CustomerOtpService } from './customer-otp.service';
import { PrismaService } from '../prisma/prisma.service';

const makePrisma = (overrides: Partial<PrismaService['customerOtp']> = {}) => ({
  customerOtp: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    ...overrides,
  },
});

describe('CustomerOtpService', () => {
  let service: CustomerOtpService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const module = await Test.createTestingModule({
      providers: [
        CustomerOtpService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CustomerOtpService);
  });

  describe('requestCode', () => {
    it('creates a new OTP record when none exists', async () => {
      (prisma.customerOtp.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.customerOtp.create as jest.Mock).mockResolvedValue({ id: 1 });

      const code = await service.requestCode('test@example.com');

      expect(code).toHaveLength(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
      expect(prisma.customerOtp.create).toHaveBeenCalledTimes(1);
    });

    it('updates existing record on second request', async () => {
      const existing = {
        id: 1,
        email: 'test@example.com',
        sendCount: 1,
        sendWindowStartedAt: new Date(),
        lockoutUntil: null,
        attemptCount: 0,
        attemptWindowStartedAt: new Date(),
      };
      (prisma.customerOtp.findFirst as jest.Mock).mockResolvedValue(existing);
      (prisma.customerOtp.update as jest.Mock).mockResolvedValue(existing);

      const code = await service.requestCode('test@example.com');
      expect(code).toHaveLength(6);
      expect(prisma.customerOtp.update).toHaveBeenCalledTimes(1);
    });

    it('throws 429 when account is locked', async () => {
      (prisma.customerOtp.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        lockoutUntil: new Date(Date.now() + 60_000),
      });

      await expect(service.requestCode('test@example.com')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('verifyCode', () => {
    it('throws BadRequestException when no OTP record exists', async () => {
      (prisma.customerOtp.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.verifyCode('test@example.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for expired OTP', async () => {
      (prisma.customerOtp.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        lockoutUntil: null,
        expiresAt: new Date(Date.now() - 1000),
        codeHash: 'somehash',
        attemptCount: 0,
        attemptWindowStartedAt: new Date(),
      });
      (prisma.customerOtp.update as jest.Mock).mockResolvedValue({});

      await expect(
        service.verifyCode('test@example.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets lockout after MAX_ATTEMPTS failures', async () => {
      (prisma.customerOtp.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        lockoutUntil: null,
        expiresAt: new Date(Date.now() + 60_000),
        codeHash: '$2a$10$invalid',
        attemptCount: 2,
        attemptWindowStartedAt: new Date(),
      });
      (prisma.customerOtp.update as jest.Mock).mockResolvedValue({});

      await expect(
        service.verifyCode('test@example.com', 'wrongcode'),
      ).rejects.toThrow(BadRequestException);

      const updateCalls = (prisma.customerOtp.update as jest.Mock).mock
        .calls as Array<[{ data: { lockoutUntil?: unknown } }]>;
      const updateCall = updateCalls[0][0];
      expect(updateCall.data.lockoutUntil).toBeInstanceOf(Date);
    });
  });
});
