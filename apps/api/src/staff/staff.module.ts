import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StaffAccountController } from './staff-account.controller';
import { StaffAuditController } from './staff-audit.controller';
import { StaffBillingController } from './staff-billing.controller';
import { StaffCalendarController } from './staff-calendar.controller';
import { StaffCustomersController } from './staff-customers.controller';
import { StaffProviderBookingsController } from './staff-provider-bookings.controller';
import { StaffServiceCategoriesController } from './staff-service-categories.controller';
import { StaffServicesController } from './staff-services.controller';
import { StaffSystemController } from './staff-system.controller';
import { StaffTeamController } from './staff-team.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    StaffAccountController,
    StaffAuditController,
    StaffBillingController,
    StaffSystemController,
    StaffCustomersController,
    StaffServicesController,
    StaffCalendarController,
    StaffServiceCategoriesController,
    StaffTeamController,
    StaffProviderBookingsController,
  ],
})
export class StaffModule {}
