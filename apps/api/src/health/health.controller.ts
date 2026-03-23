import { Controller, Get } from '@nestjs/common';
import { createHealthResponse } from '@openbook/shared';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return createHealthResponse('openbook-api', process.env.APP_VERSION);
  }
}
