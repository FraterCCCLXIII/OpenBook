import {
  BadRequestException,
  CanActivate,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { StaffWebhooksController } from './staff-webhooks.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StaffAuthGuard } from '../auth/staff-auth.guard';

class NoopGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

const allPerms = { view: true, add: true, edit: true, delete: true };
const noPerms = { view: false, add: false, edit: false, delete: false };

const mockReq = (webhookView = true) => ({
  staffUser: {
    userId: '1',
    permissions: {
      webhooks: webhookView ? allPerms : noPerms,
      appointments: allPerms,
      customers: allPerms,
      services: allPerms,
      users: allPerms,
      system_settings: allPerms,
      user_settings: allPerms,
      blocked_periods: allPerms,
    },
  },
});

const stubWebhook = {
  id: 1,
  name: 'Test Hook',
  url: 'https://example.com/webhook',
  actions: 'appointment.created',
  secretToken: null,
  isActive: 1,
  isSslVerified: 1,
  notes: null,
  createDatetime: new Date(),
  updateDatetime: new Date(),
};

const mockPrisma = () => ({
  webhook: {
    findMany: jest.fn().mockResolvedValue([stubWebhook]),
    create: jest.fn().mockResolvedValue(stubWebhook),
    findUnique: jest.fn().mockResolvedValue(stubWebhook),
    update: jest.fn().mockResolvedValue(stubWebhook),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
});

describe('StaffWebhooksController', () => {
  let controller: StaffWebhooksController;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      controllers: [StaffWebhooksController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    })
      .overrideGuard(StaffAuthGuard)
      .useClass(NoopGuard)
      .compile();

    controller = module.get(StaffWebhooksController);
  });

  describe('list', () => {
    it('returns items array', async () => {
      const result = await controller.list(mockReq() as never);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Test Hook');
    });

    it('throws ForbiddenException with no webhook permission', async () => {
      await expect(controller.list(mockReq(false) as never)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('creates webhook and returns it', async () => {
      const result = await controller.create(mockReq() as never, {
        name: 'Test Hook',
        url: 'https://example.com/webhook',
      });
      expect(result.name).toBe('Test Hook');
    });

    it('throws BadRequestException when name missing', async () => {
      await expect(
        controller.create(mockReq() as never, { url: 'https://example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates webhook', async () => {
      const result = await controller.update(mockReq() as never, '1', {
        name: 'Updated',
      });
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when webhook missing', async () => {
      prisma.webhook.findUnique.mockResolvedValue(null);
      await expect(
        controller.update(mockReq() as never, '999', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes webhook', async () => {
      const result = await controller.remove(mockReq() as never, '1');
      expect(result.ok).toBe(true);
    });
  });
});
