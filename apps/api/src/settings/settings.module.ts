import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  SettingsController,
  StaffSettingsController,
} from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule],
  controllers: [SettingsController, StaffSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
