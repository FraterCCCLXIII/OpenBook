import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { BookingCatalogService } from './booking-catalog.service';
import { BookingController } from './booking.controller';
import { BookingRegistrationService } from './booking-registration.service';

@Module({
  imports: [AvailabilityModule, PrismaModule, SettingsModule],
  controllers: [BookingController],
  providers: [BookingCatalogService, BookingRegistrationService],
})
export class BookingModule {}
