import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: PrismaService,
          useValue: {
            setting: { findFirst: jest.fn() },
            blockedPeriod: { count: jest.fn() },
            service: { findUnique: jest.fn() },
            user: { findUnique: jest.fn() },
            appointment: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(AvailabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects non Y-m-d selected_date for getAvailableHours', async () => {
    await expect(
      service.getAvailableHours({
        serviceId: 1n,
        providerId: 1n,
        selectedDate: '03-22-2026',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
