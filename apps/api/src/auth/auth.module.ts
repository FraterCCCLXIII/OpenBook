import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { CustomerOtpService } from './customer-otp.service';
import { StaffAuthGuard } from './staff-auth.guard';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => SettingsModule),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'openbook-dev-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CustomerOtpService,
    StaffAuthGuard,
    CustomerAuthGuard,
  ],
  exports: [AuthService, CustomerOtpService, StaffAuthGuard, CustomerAuthGuard],
})
export class AuthModule {}
