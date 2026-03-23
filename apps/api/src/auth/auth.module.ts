import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomerAuthGuard } from './customer-auth.guard';
import { StaffAuthGuard } from './staff-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'openbook-dev-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, StaffAuthGuard, CustomerAuthGuard],
  exports: [AuthService, StaffAuthGuard, CustomerAuthGuard],
})
export class AuthModule {}
