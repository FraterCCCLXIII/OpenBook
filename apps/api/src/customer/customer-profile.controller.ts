import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import {
  CustomerAuthGuard,
  type RequestWithCustomer,
} from '../auth/customer-auth.guard';

@Controller('customer/profile')
@UseGuards(CustomerAuthGuard)
export class CustomerProfileController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  async get(@Req() req: RequestWithCustomer) {
    return this.auth.meCustomer(BigInt(req.customerUser.customerId));
  }

  @Patch()
  async patch(
    @Req() req: RequestWithCustomer,
    @Body()
    body: {
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      address?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      timezone?: string;
    },
  ) {
    return this.auth.updateCustomerProfile(
      BigInt(req.customerUser.customerId),
      {
        firstName: body.first_name,
        lastName: body.last_name,
        phoneNumber: body.phone_number,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zip_code,
        timezone: body.timezone,
      },
    );
  }
}
