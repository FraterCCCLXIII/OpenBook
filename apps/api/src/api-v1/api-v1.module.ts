import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiV1Controller } from './api-v1.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ApiV1Controller],
})
export class ApiV1Module {}
