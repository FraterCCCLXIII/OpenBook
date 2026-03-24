import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  SettingsController,
  StaffSettingsController,
} from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SettingsController, StaffSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
