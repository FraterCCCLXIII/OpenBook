import { CanActivate, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { StaffDashboardController } from './staff-dashboard.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StaffAuthGuard } from '../auth/staff-auth.guard';

class NoopGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

const allPerms = { view: true, add: true, edit: true, delete: true };
const noPerms = { view: false, add: false, edit: false, delete: false };

const mockReq = (appointmentsView = true) => ({
  staffUser: {
    userId: '1',
    permissions: {
      appointments: appointmentsView ? allPerms : noPerms,
      customers: allPerms,
      services: allPerms,
      users: allPerms,
      system_settings: allPerms,
      user_settings: allPerms,
      webhooks: allPerms,
      blocked_periods: allPerms,
    },
  },
});

const mockPrisma = () => ({
  appointment: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
  },
  role: {
    findFirst: jest.fn().mockResolvedValue({ id: BigInt(4) }),
  },
  user: {
    count: jest.fn().mockResolvedValue(0),
  },
});

describe('StaffDashboardController', () => {
  let controller: StaffDashboardController;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      controllers: [StaffDashboardController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    })
      .overrideGuard(StaffAuthGuard)
      .useClass(NoopGuard)
      .compile();

    controller = module.get(StaffDashboardController);
  });

  it('returns stats with correct shape', async () => {
    const result = await controller.stats(mockReq() as never);

    expect(result).toHaveProperty('todayAppointments');
    expect(result).toHaveProperty('upcomingAppointments');
    expect(result).toHaveProperty('totalCustomers');
    expect(result).toHaveProperty('recentAppointments');
    expect(Array.isArray(result.recentAppointments)).toBe(true);
  });

  it('throws ForbiddenException when appointments permission is false', async () => {
    await expect(controller.stats(mockReq(false) as never)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
