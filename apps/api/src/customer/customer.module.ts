import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerAppointmentsController } from './customer-appointments.controller';
import { CustomerFormsController } from './customer-forms.controller';
import { CustomerProfileController } from './customer-profile.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    CustomerAppointmentsController,
    CustomerProfileController,
    CustomerFormsController,
  ],
})
export class CustomerModule {}
