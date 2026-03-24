import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AvailabilityService } from '../availability/availability.service';
import { JobsQueueService } from '../jobs/jobs-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { BookingCatalogService } from './booking-catalog.service';
import { BookingRegistrationService } from './booking-registration.service';

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
      getSettingsByNames: jest.fn().mockResolvedValue({
        require_captcha: '0',
        require_phone_number: '0',
        require_notes: '0',
        require_first_name: '1',
        require_last_name: '1',
        require_address: '0',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingRegistrationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AvailabilityService, useValue: availability },
        { provide: BookingCatalogService, useValue: catalog },
        { provide: JobsQueueService, useValue: jobs },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    const svc = moduleRef.get(BookingRegistrationService);

    await expect(
      svc.createGuestAppointment({
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
      getSettingsByNames: jest.fn().mockResolvedValue({
        require_captcha: '0',
        require_phone_number: '0',
        require_notes: '0',
        require_first_name: '1',
        require_last_name: '1',
        require_address: '0',
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingRegistrationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AvailabilityService, useValue: availability },
        { provide: BookingCatalogService, useValue: catalog },
        { provide: JobsQueueService, useValue: jobs },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    const svc = moduleRef.get(BookingRegistrationService);
    const out = await svc.createGuestAppointment({
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
});
