import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { AvailabilityService } from '../availability/availability.service';
import { BookingCatalogService } from './booking-catalog.service';
import { BookingRegistrationService } from './booking-registration.service';

type UnavailableDatesBody = {
  service_id?: string;
  provider_id?: string;
  selected_date?: string;
};

type AvailableHoursBody = {
  service_id?: string;
  provider_id?: string;
  selected_date?: string;
};

@Controller('booking')
export class BookingController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly catalog: BookingCatalogService,
    private readonly registration: BookingRegistrationService,
  ) {}

  /** Anonymous: list bookable services. */
  @Get('services')
  listServices() {
    return this.catalog.listPublicServices();
  }

  /** Anonymous: providers for a service. */
  @Get('services/:serviceId/providers')
  listProviders(@Param('serviceId') serviceId: string) {
    return this.catalog.listProvidersForService(serviceId);
  }

  @Post('unavailable-dates')
  async unavailableDates(@Body() body: UnavailableDatesBody) {
    const serviceId = BigInt(body.service_id ?? '0');
    const providerId = BigInt(body.provider_id ?? '0');
    const selectedDate = body.selected_date?.trim();
    if (!selectedDate) {
      return [];
    }
    const result = await this.availability.getUnavailableDates({
      serviceId,
      providerId,
      selectedMonth: selectedDate,
    });
    if (result.isMonthUnavailable) {
      return { is_month_unavailable: true };
    }
    return result.dates;
  }

  @Post('available-hours')
  async availableHours(@Body() body: AvailableHoursBody) {
    const serviceId = BigInt(body.service_id ?? '0');
    const providerId = BigInt(body.provider_id ?? '0');
    const selectedDate = body.selected_date?.trim();
    if (!selectedDate) {
      return [];
    }
    return this.availability.getAvailableHours({
      serviceId,
      providerId,
      selectedDate,
    });
  }

  /** Anonymous guest booking — creates ea_appointments row (customer optional). */
  @Post('appointments')
  async createAppointment(
    @Body()
    body: {
      service_id?: string;
      provider_id?: string;
      selected_date?: string;
      start_time?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      notes?: string;
    },
  ) {
    const serviceId = BigInt(body.service_id ?? '0');
    const providerId = BigInt(body.provider_id ?? '0');
    const selectedDate = body.selected_date?.trim() ?? '';
    const startTime = body.start_time?.trim() ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      throw new BadRequestException('selected_date must be Y-m-d');
    }
    if (!startTime) {
      throw new BadRequestException('start_time is required');
    }
    return this.registration.createGuestAppointment({
      serviceId,
      providerId,
      selectedDate,
      startTimeHm: startTime,
      firstName: body.first_name ?? '',
      lastName: body.last_name ?? '',
      email: body.email ?? '',
      phone: body.phone,
      notes: body.notes,
    });
  }
}
