import {
  BadRequestException,
  CanActivate,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { StripeCheckoutController } from './stripe-checkout.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerAuthGuard } from '../auth/customer-auth.guard';

class NoopGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

const mockReq = () => ({
  customerUser: { customerId: '1' },
});

const mockAppointment = {
  id: BigInt(1),
  idUsersCustomer: BigInt(1),
  service: { name: 'Consultation', price: '50.00', currency: 'usd' },
};

const mockPrisma = () => ({
  appointment: {
    findFirst: jest.fn().mockResolvedValue(mockAppointment),
    findUnique: jest.fn().mockResolvedValue(mockAppointment),
  },
  appointmentPayment: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
});

describe('StripeCheckoutController', () => {
  let controller: StripeCheckoutController;
  let prisma: ReturnType<typeof mockPrisma>;
  const originalEnv = process.env;

  beforeEach(async () => {
    prisma = mockPrisma();
    const module = await Test.createTestingModule({
      controllers: [StripeCheckoutController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    })
      .overrideGuard(CustomerAuthGuard)
      .useClass(NoopGuard)
      .compile();

    controller = module.get(StripeCheckoutController);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws ServiceUnavailableException when STRIPE_SECRET_KEY not set', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    await expect(
      controller.createCheckout(mockReq() as never, { appointmentId: '1' }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('throws BadRequestException when appointmentId missing', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    await expect(
      controller.createCheckout(mockReq() as never, {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when appointment not found', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    prisma.appointment.findFirst.mockResolvedValue(null);
    await expect(
      controller.createCheckout(mockReq() as never, { appointmentId: '1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when service has no price', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    prisma.appointment.findFirst.mockResolvedValue({
      ...mockAppointment,
      service: { name: 'Free', price: null, currency: 'usd' },
    });
    await expect(
      controller.createCheckout(mockReq() as never, { appointmentId: '1' }),
    ).rejects.toThrow(BadRequestException);
  });
});
