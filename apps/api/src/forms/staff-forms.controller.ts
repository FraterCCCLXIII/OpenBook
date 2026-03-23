import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';
import { FormsService, type CreateFormInput } from './forms.service';

@Controller('staff/forms')
@UseGuards(StaffAuthGuard)
export class StaffFormsController {
  constructor(private readonly forms: FormsService) {}

  @Get()
  async list(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    return { items: await this.forms.listForms() };
  }

  @Get(':id')
  async detail(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    const form = await this.forms.getForm(Number(id));
    if (!form) throw new NotFoundException();
    return form;
  }

  @Post()
  async create(@Req() req: RequestWithStaff, @Body() body: CreateFormInput) {
    if (!can(req.staffUser.permissions, 'system_settings', 'add')) {
      throw new ForbiddenException();
    }
    return this.forms.createForm(body);
  }

  @Put(':id')
  async update(
    @Req() req: RequestWithStaff,
    @Param('id') id: string,
    @Body() body: Partial<CreateFormInput>,
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    return this.forms.updateForm(Number(id), body);
  }

  @Delete(':id')
  async remove(@Req() req: RequestWithStaff, @Param('id') id: string) {
    if (!can(req.staffUser.permissions, 'system_settings', 'delete')) {
      throw new ForbiddenException();
    }
    return this.forms.deleteForm(Number(id));
  }
}
