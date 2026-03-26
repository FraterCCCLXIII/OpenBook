import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AvailabilityModule } from '../availability/availability.module';
import { JobsModule } from '../jobs/jobs.module';
import { SettingsModule } from '../settings/settings.module';
import { CustomerAppointmentsController } from './customer-appointments.controller';
import { CustomerConsentsController } from './customer-consents.controller';
import { CustomerProfileController } from './customer-profile.controller';

@Module({
  imports: [AuthModule, PrismaModule, AvailabilityModule, JobsModule, SettingsModule],
  controllers: [
    CustomerAppointmentsController,
    CustomerConsentsController,
    CustomerProfileController,
  ],
})
export class CustomerModule {}
