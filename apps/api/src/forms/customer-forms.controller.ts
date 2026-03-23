import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CustomerAuthGuard,
  type RequestWithCustomer,
} from '../auth/customer-auth.guard';
import { FormsService } from './forms.service';

@Controller('customer/forms')
@UseGuards(CustomerAuthGuard)
export class CustomerFormsController {
  constructor(private readonly forms: FormsService) {}

  @Get()
  async list() {
    const items = await this.forms.getFormsForCustomer('customer');
    return { items };
  }

  @Get(':formId')
  async detail(@Param('formId') formId: string) {
    const form = await this.forms.getFormForCustomer(Number(formId));
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  @Post(':formId/submit')
  async submit(
    @Req() req: RequestWithCustomer,
    @Param('formId') formId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.forms.submitForm(
      Number(formId),
      BigInt(req.customerUser.customerId),
      body,
    );
  }

  @Get(':formId/submission')
  async mySubmission(
    @Req() req: RequestWithCustomer,
    @Param('formId') formId: string,
  ) {
    const submission = await this.forms.getSubmission(
      Number(formId),
      BigInt(req.customerUser.customerId),
    );
    return { submission };
  }
}
