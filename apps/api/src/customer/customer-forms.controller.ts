import { Controller, Get, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from '../auth/customer-auth.guard';

/**
 * Placeholder until PHP `customer/forms` schema is ported.
 */
@Controller('customer/forms')
@UseGuards(CustomerAuthGuard)
export class CustomerFormsController {
  @Get()
  list() {
    return { items: [] as { id: string; name: string }[] };
  }
}
