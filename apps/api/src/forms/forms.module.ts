import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { CustomerFormsController } from './customer-forms.controller';
import { StaffFormsController } from './staff-forms.controller';
import { FormsService } from './forms.service';

@Module({
  imports: [AuthModule, PrismaModule, SettingsModule],
  controllers: [StaffFormsController, CustomerFormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
