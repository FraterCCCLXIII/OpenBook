import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { AvailabilityService } from '../availability/availability.service';
import { JobsQueueService } from '../jobs/jobs-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { BookingCatalogService } from './booking-catalog.service';
import { BookingRegistrationService } from './booking-registration.service';

const emptyReq = { cookies: {} } as unknown as Request;

describe('BookingRegistrationService', () => {
  it('rejects when overlap count reaches service capacity', async () => {
    const serviceId = 1n;
    const providerId = 2n;
    const prisma = {
      service: {
        findUnique: jest.fn().mockResolvedValue({
          id: serviceId,
          duration: 30,
          attendantsNumber: 1,
        }),
      },
      appointment: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn(),
      },
    };
    const availability = {
      getAvailableHours: jest.fn().mockResolvedValue(['09:00']),
    };
    const catalog = {
      assertProviderOffersService: jest.fn().mockResolvedValue(undefined),
    };
    const jobs = {
      enqueueBookingConfirmation: jest.fn(),
    };
    const settings = {
      isPublicBookingDisabled: jest.fn().mockResolvedValue(false),
      isGuestBookingAllowed: jest.fn().mockResolvedValue(true),
      getSettingsByNames: jest.fn().mockResolvedValue({
        require_captcha: '0',
        require_phone_number: '0',
        require_notes: '0',
        require_first_name: '1',
        require_last_name: '1',
        require_address: '0',
      }),
    };
    const auth = { verifyToken: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingRegistrationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AvailabilityService, useValue: availability },
        { provide: BookingCatalogService, useValue: catalog },
        { provide: JobsQueueService, useValue: jobs },
        { provide: SettingsService, useValue: settings },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();

    const svc = moduleRef.get(BookingRegistrationService);

    await expect(
      svc.createGuestAppointment({
        req: emptyReq,
        serviceId,
        providerId,
        selectedDate: '2030-01-15',
        startTimeHm: '9:00',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.appointment.create).not.toHaveBeenCalled();
    expect(jobs.enqueueBookingConfirmation).not.toHaveBeenCalled();
  });

  it('allows booking when overlap is below capacity', async () => {
    const serviceId = 1n;
    const providerId = 2n;
    const prisma = {
      service: {
        findUnique: jest.fn().mockResolvedValue({
          id: serviceId,
          duration: 30,
          attendantsNumber: 2,
        }),
      },
      appointment: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue({
          id: 99n,
          hash: 'abc',
          startDatetime: new Date('2030-01-15T09:00:00'),
          endDatetime: new Date('2030-01-15T09:30:00'),
        }),
      },
    };
    const availability = {
      getAvailableHours: jest.fn().mockResolvedValue(['09:00']),
    };
    const catalog = {
      assertProviderOffersService: jest.fn().mockResolvedValue(undefined),
    };
    const jobs = {
      enqueueBookingConfirmation: jest.fn(),
    };
    const settings = {
      isPublicBookingDisabled: jest.fn().mockResolvedValue(false),
      isGuestBookingAllowed: jest.fn().mockResolvedValue(true),
      getSettingsByNames: jest.fn().mockResolvedValue({
        require_captcha: '0',
        require_phone_number: '0',
        require_notes: '0',
        require_first_name: '1',
        require_last_name: '1',
        require_address: '0',
      }),
    };
    const auth = { verifyToken: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingRegistrationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AvailabilityService, useValue: availability },
        { provide: BookingCatalogService, useValue: catalog },
        { provide: JobsQueueService, useValue: jobs },
        { provide: SettingsService, useValue: settings },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();

    const svc = moduleRef.get(BookingRegistrationService);
    const out = await svc.createGuestAppointment({
      req: emptyReq,
      serviceId,
      providerId,
      selectedDate: '2030-01-15',
      startTimeHm: '9:00',
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
    });

    expect(out.id).toBe('99');
    expect(jobs.enqueueBookingConfirmation).toHaveBeenCalledWith('99');
  });

  it('rejects guest booking when public booking is disabled', async () => {
    const prisma = { service: { findUnique: jest.fn() }, appointment: { create: jest.fn() } };
    const settings = {
      isPublicBookingDisabled: jest.fn().mockResolvedValue(true),
      isGuestBookingAllowed: jest.fn(),
      getSettingsByNames: jest.fn(),
    };
    const auth = { verifyToken: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingRegistrationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AvailabilityService, useValue: {} },
        { provide: BookingCatalogService, useValue: {} },
        { provide: JobsQueueService, useValue: {} },
        { provide: SettingsService, useValue: settings },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();

    const svc = moduleRef.get(BookingRegistrationService);

    await expect(
      svc.createGuestAppointment({
        req: emptyReq,
        serviceId: 1n,
        providerId: 2n,
        selectedDate: '2030-01-15',
        startTimeHm: '09:00',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(settings.getSettingsByNames).not.toHaveBeenCalled();
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it('rejects anonymous booking when guest booking is disabled', async () => {
    const prisma = { service: { findUnique: jest.fn() }, appointment: { create: jest.fn() } };
    const settings = {
      isPublicBookingDisabled: jest.fn().mockResolvedValue(false),
      isGuestBookingAllowed: jest.fn().mockResolvedValue(false),
      getSettingsByNames: jest.fn(),
    };
    const auth = { verifyToken: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingRegistrationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AvailabilityService, useValue: {} },
        { provide: BookingCatalogService, useValue: {} },
        { provide: JobsQueueService, useValue: {} },
        { provide: SettingsService, useValue: settings },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();

    const svc = moduleRef.get(BookingRegistrationService);

    await expect(
      svc.createGuestAppointment({
        req: emptyReq,
        serviceId: 1n,
        providerId: 2n,
        selectedDate: '2030-01-15',
        startTimeHm: '09:00',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(auth.verifyToken).not.toHaveBeenCalled();
    expect(settings.getSettingsByNames).not.toHaveBeenCalled();
  });
});
