import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';
import { FormsService, type CreateFormInput } from './forms.service';
import { sendFormReminderEmail } from '../jobs/email.service';
import { SettingsService } from '../settings/settings.service';

@Controller('staff/forms')
@UseGuards(StaffAuthGuard)
export class StaffFormsController {
  constructor(
    private readonly forms: FormsService,
    private readonly settings: SettingsService,
  ) {}

  @Get()
  async list(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    return { items: await this.forms.listForms() };
  }

  /**
   * Returns forms assigned to a given role slug.
   * When `userId` query param is provided, includes per-form completion status.
   */
  @Get('for-role/:roleSlug')
  async forRole(
    @Req() req: RequestWithStaff,
    @Param('roleSlug') roleSlug: string,
    @Query('userId') userId?: string,
  ) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    if (userId) {
      const items = await this.forms.getFormsForRoleWithStatus(roleSlug, BigInt(userId));
      return { items };
    }
    const items = await this.forms.getFormsForRole(roleSlug);
    return { items };
  }

  /** Returns a single form with its fields + the given user's submission (if any). */
  @Get(':formId/view/:userId')
  async viewForUser(
    @Req() req: RequestWithStaff,
    @Param('formId') formId: string,
    @Param('userId') userId: string,
  ) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    return this.forms.getFormWithSubmission(Number(formId), BigInt(userId));
  }

  /** Reset (delete) a user's submission for a specific form. */
  @Delete(':formId/submission/:userId')
  async resetSubmission(
    @Req() req: RequestWithStaff,
    @Param('formId') formId: string,
    @Param('userId') userId: string,
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    return this.forms.deleteFormSubmission(Number(formId), BigInt(userId));
  }

  /** Send a reminder email to a user for their incomplete forms. */
  @Post('remind/:userId')
  async sendReminder(
    @Req() req: RequestWithStaff,
    @Param('userId') userId: string,
    @Body() body: { roleSlug: string },
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    if (!body.roleSlug) throw new BadRequestException('roleSlug is required');

    const user = await this.forms.getUserForEmail(BigInt(userId));
    if (!user?.email) throw new BadRequestException('User has no email address');

    const allForms = await this.forms.getFormsForRoleWithStatus(body.roleSlug, BigInt(userId));
    const incomplete = allForms.filter((f) => f.submission === null);

    if (incomplete.length === 0) {
      return { ok: true, sent: false, reason: 'All forms already completed' };
    }

    const recipientName =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

    const [companyName, logoPng, companyLogo] = await Promise.all([
      this.settings.getSettingByName('company_name'),
      this.settings.getSettingByName('company_logo_email_png'),
      this.settings.getSettingByName('company_logo'),
    ]);

    await sendFormReminderEmail(
      user.email,
      recipientName,
      incomplete.map((f) => ({ name: f.name, description: f.description })),
      {
        companyName: companyName ?? 'OpenBook',
        logoDataUrl: logoPng,
        companyLogoDataUrl: companyLogo,
      },
    );

    return { ok: true, sent: true, count: incomplete.length };
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
