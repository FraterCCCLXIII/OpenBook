import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiV1Module } from './api-v1/api-v1.module';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { CustomerModule } from './customer/customer.module';
import { StaffModule } from './staff/staff.module';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JobsModule,
    PrismaModule,
    AuthModule,
    BookingModule,
    ApiV1Module,
    HealthModule,
    SettingsModule,
    StaffModule,
    CustomerModule,
    StripeModule,
  ],
})
export class AppModule {}
