import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiV1TokenGuard } from './api-v1.guard';

@Controller('v1')
@UseGuards(ApiV1TokenGuard)
export class ApiV1Controller {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Health ────────────────────────────────────────────────────────────────

  @Get('ping')
  ping() {
    return { ok: true, service: 'openbook-api', api: 'v1' };
  }

  // ─── Services ──────────────────────────────────────────────────────────────

  @Get('services')
  async listServices(@Query('take') takeRaw?: string) {
    const take = clamp(takeRaw, 100, 50);
    const rows = await this.prisma.service.findMany({
      take,
      orderBy: { id: 'asc' },
      include: { category: true },
    });
    return { items: rows.map(mapService) };
  }

  @Get('services/:id')
  async getService(@Param('id') id: string) {
    const row = await this.prisma.service.findUnique({
      where: { id: toBigInt(id) },
      include: { category: true },
    });
    if (!row) throw new NotFoundException();
    return mapService(row);
  }

  @Post('services')
  async createService(@Body() body: Record<string, unknown>) {
    requireFields(body, ['name']);
    const row = await this.prisma.service.create({
      data: {
        name: str(body.name).trim(),
        duration: body.duration != null ? Number(body.duration) : 30,
        price: body.price != null ? str(body.price) : null,
        currency: body.currency ? str(body.currency) : 'USD',
        description: body.description ? str(body.description) : null,
        availabilitiesType: 'flexible',
        attendantsNumber: 1,
        isPrivate: 0,
      },
      include: { category: true },
    });
    return mapService(row);
  }

  @Put('services/:id')
  async updateService(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.service.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.service.update({
      where: { id: toBigInt(id) },
      data: {
        ...(body.name !== undefined ? { name: str(body.name).trim() } : {}),
        ...(body.duration !== undefined
          ? { duration: Number(body.duration) }
          : {}),
        ...(body.price !== undefined
          ? { price: body.price === null ? null : str(body.price) }
          : {}),
        ...(body.currency !== undefined
          ? { currency: str(body.currency) }
          : {}),
        ...(body.description !== undefined
          ? { description: str(body.description) }
          : {}),
      },
      include: { category: true },
    });
    return mapService(row);
  }

  @Delete('services/:id')
  async deleteService(@Param('id') id: string) {
    await this.prisma.service.deleteMany({ where: { id: toBigInt(id) } });
    return { ok: true };
  }

  // ─── Service categories ────────────────────────────────────────────────────

  @Get('service-categories')
  async listServiceCategories() {
    const rows = await this.prisma.serviceCategory.findMany({
      orderBy: { id: 'asc' },
    });
    return {
      items: rows.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        description: c.description,
      })),
    };
  }

  @Get('service-categories/:id')
  async getServiceCategory(@Param('id') id: string) {
    const row = await this.prisma.serviceCategory.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!row) throw new NotFoundException();
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
    };
  }

  @Post('service-categories')
  async createServiceCategory(@Body() body: Record<string, unknown>) {
    requireFields(body, ['name']);
    const row = await this.prisma.serviceCategory.create({
      data: {
        name: str(body.name).trim(),
        description: body.description ? str(body.description) : null,
      },
    });
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
    };
  }

  @Put('service-categories/:id')
  async updateServiceCategory(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.serviceCategory.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.serviceCategory.update({
      where: { id: toBigInt(id) },
      data: {
        ...(body.name !== undefined ? { name: str(body.name).trim() } : {}),
        ...(body.description !== undefined
          ? { description: str(body.description) }
          : {}),
      },
    });
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
    };
  }

  @Delete('service-categories/:id')
  async deleteServiceCategory(@Param('id') id: string) {
    await this.prisma.serviceCategory.deleteMany({
      where: { id: toBigInt(id) },
    });
    return { ok: true };
  }

  // ─── Appointments ──────────────────────────────────────────────────────────

  @Get('appointments')
  async listAppointments(
    @Query('take') takeRaw?: string,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    const take = clamp(takeRaw, 100, 50);
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (fromStr) dateFilter.gte = new Date(fromStr);
    if (toStr) dateFilter.lte = new Date(toStr);
    const rows = await this.prisma.appointment.findMany({
      take,
      orderBy: { id: 'desc' },
      where: {
        isUnavailability: 0,
        ...(Object.keys(dateFilter).length > 0
          ? { startDatetime: dateFilter }
          : {}),
      },
    });
    return { items: rows.map(mapAppointment) };
  }

  @Get('appointments/:id')
  async getAppointment(@Param('id') id: string) {
    const row = await this.prisma.appointment.findFirst({
      where: { id: toBigInt(id), isUnavailability: 0 },
    });
    if (!row) throw new NotFoundException();
    return mapAppointment(row);
  }

  @Post('appointments')
  async createAppointment(@Body() body: Record<string, unknown>) {
    requireFields(body, ['start', 'end']);
    const row = await this.prisma.appointment.create({
      data: {
        bookDatetime: new Date(),
        startDatetime: new Date(str(body.start)),
        endDatetime: new Date(str(body.end)),
        notes: body.notes ? str(body.notes) : null,
        isUnavailability: 0,
        idUsersProvider: body.providerId
          ? toBigInt(str(body.providerId))
          : null,
        idUsersCustomer: body.customerId
          ? toBigInt(str(body.customerId))
          : null,
        idServices: body.serviceId ? toBigInt(str(body.serviceId)) : null,
      },
    });
    return mapAppointment(row);
  }

  @Put('appointments/:id')
  async updateAppointment(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id: toBigInt(id), isUnavailability: 0 },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.appointment.update({
      where: { id: toBigInt(id) },
      data: {
        ...(body.start !== undefined
          ? { startDatetime: new Date(str(body.start)) }
          : {}),
        ...(body.end !== undefined
          ? { endDatetime: new Date(str(body.end)) }
          : {}),
        ...(body.notes !== undefined ? { notes: str(body.notes) } : {}),
        ...(body.providerId !== undefined
          ? { idUsersProvider: toBigInt(str(body.providerId)) }
          : {}),
        ...(body.customerId !== undefined
          ? { idUsersCustomer: toBigInt(str(body.customerId)) }
          : {}),
        ...(body.serviceId !== undefined
          ? { idServices: toBigInt(str(body.serviceId)) }
          : {}),
      },
    });
    return mapAppointment(row);
  }

  @Delete('appointments/:id')
  async deleteAppointment(@Param('id') id: string) {
    await this.prisma.appointment.deleteMany({
      where: { id: toBigInt(id), isUnavailability: 0 },
    });
    return { ok: true };
  }

  // ─── Customers ─────────────────────────────────────────────────────────────

  @Get('customers')
  async listCustomers(@Query('take') takeRaw?: string) {
    const take = clamp(takeRaw, 100, 50);
    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    if (!customerRole) return { items: [] };
    const rows = await this.prisma.user.findMany({
      where: { idRoles: customerRole.id },
      take,
      orderBy: { id: 'asc' },
    });
    return { items: rows.map(mapUser) };
  }

  @Get('customers/:id')
  async getCustomer(@Param('id') id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!row) throw new NotFoundException();
    return mapUser(row);
  }

  @Post('customers')
  async createCustomer(@Body() body: Record<string, unknown>) {
    requireFields(body, ['email']);
    const customerRole = await this.prisma.role.findFirst({
      where: { slug: 'customer' },
    });
    if (!customerRole)
      throw new BadRequestException('Customer role not seeded');
    const row = await this.prisma.user.create({
      data: {
        firstName: body.firstName ? str(body.firstName) : null,
        lastName: body.lastName ? str(body.lastName) : null,
        email: str(body.email).trim().toLowerCase(),
        idRoles: customerRole.id,
        timezone: body.timezone ? str(body.timezone) : 'UTC',
      },
    });
    return mapUser(row);
  }

  @Put('customers/:id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.user.update({
      where: { id: toBigInt(id) },
      data: {
        ...(body.firstName !== undefined
          ? { firstName: str(body.firstName) }
          : {}),
        ...(body.lastName !== undefined
          ? { lastName: str(body.lastName) }
          : {}),
        ...(body.email !== undefined
          ? { email: str(body.email).trim().toLowerCase() }
          : {}),
        ...(body.timezone !== undefined
          ? { timezone: str(body.timezone) }
          : {}),
      },
    });
    return mapUser(row);
  }

  @Delete('customers/:id')
  async deleteCustomer(@Param('id') id: string) {
    await this.prisma.user.deleteMany({ where: { id: toBigInt(id) } });
    return { ok: true };
  }

  // ─── Providers ─────────────────────────────────────────────────────────────

  @Get('providers')
  async listProviders(@Query('take') takeRaw?: string) {
    const take = clamp(takeRaw, 100, 50);
    const role = await this.prisma.role.findFirst({
      where: { slug: 'provider' },
    });
    if (!role) return { items: [] };
    const rows = await this.prisma.user.findMany({
      where: { idRoles: role.id },
      take,
      orderBy: { id: 'asc' },
    });
    return { items: rows.map(mapUser) };
  }

  @Get('providers/:id')
  async getProvider(@Param('id') id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!row) throw new NotFoundException();
    return mapUser(row);
  }

  @Post('providers')
  async createProvider(@Body() body: Record<string, unknown>) {
    requireFields(body, ['email']);
    const role = await this.prisma.role.findFirst({
      where: { slug: 'provider' },
    });
    if (!role) throw new BadRequestException('Provider role not seeded');
    const row = await this.prisma.user.create({
      data: {
        firstName: body.firstName ? str(body.firstName) : null,
        lastName: body.lastName ? str(body.lastName) : null,
        email: str(body.email).trim().toLowerCase(),
        idRoles: role.id,
        timezone: body.timezone ? str(body.timezone) : 'UTC',
      },
    });
    return mapUser(row);
  }

  @Put('providers/:id')
  async updateProvider(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.user.update({
      where: { id: toBigInt(id) },
      data: {
        ...(body.firstName !== undefined
          ? { firstName: str(body.firstName) }
          : {}),
        ...(body.lastName !== undefined
          ? { lastName: str(body.lastName) }
          : {}),
        ...(body.email !== undefined
          ? { email: str(body.email).trim().toLowerCase() }
          : {}),
        ...(body.timezone !== undefined
          ? { timezone: str(body.timezone) }
          : {}),
      },
    });
    return mapUser(row);
  }

  @Delete('providers/:id')
  async deleteProvider(@Param('id') id: string) {
    await this.prisma.user.deleteMany({ where: { id: toBigInt(id) } });
    return { ok: true };
  }

  // ─── Admins ────────────────────────────────────────────────────────────────

  @Get('admins')
  async listAdmins() {
    const role = await this.prisma.role.findFirst({ where: { slug: 'admin' } });
    if (!role) return { items: [] };
    const rows = await this.prisma.user.findMany({
      where: { idRoles: role.id },
      orderBy: { id: 'asc' },
    });
    return { items: rows.map(mapUser) };
  }

  @Get('admins/:id')
  async getAdmin(@Param('id') id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!row) throw new NotFoundException();
    return mapUser(row);
  }

  @Post('admins')
  async createAdmin(@Body() body: Record<string, unknown>) {
    requireFields(body, ['email']);
    const role = await this.prisma.role.findFirst({ where: { slug: 'admin' } });
    if (!role) throw new BadRequestException('Admin role not seeded');
    const row = await this.prisma.user.create({
      data: {
        firstName: body.firstName ? str(body.firstName) : null,
        lastName: body.lastName ? str(body.lastName) : null,
        email: str(body.email).trim().toLowerCase(),
        idRoles: role.id,
        timezone: body.timezone ? str(body.timezone) : 'UTC',
      },
    });
    return mapUser(row);
  }

  @Put('admins/:id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.user.update({
      where: { id: toBigInt(id) },
      data: {
        ...(body.firstName !== undefined
          ? { firstName: str(body.firstName) }
          : {}),
        ...(body.lastName !== undefined
          ? { lastName: str(body.lastName) }
          : {}),
        ...(body.email !== undefined
          ? { email: str(body.email).trim().toLowerCase() }
          : {}),
      },
    });
    return mapUser(row);
  }

  @Delete('admins/:id')
  async deleteAdmin(@Param('id') id: string) {
    await this.prisma.user.deleteMany({ where: { id: toBigInt(id) } });
    return { ok: true };
  }

  // ─── Secretaries ───────────────────────────────────────────────────────────

  @Get('secretaries')
  async listSecretaries() {
    const role = await this.prisma.role.findFirst({
      where: { slug: 'secretary' },
    });
    if (!role) return { items: [] };
    const rows = await this.prisma.user.findMany({
      where: { idRoles: role.id },
      orderBy: { id: 'asc' },
    });
    return { items: rows.map(mapUser) };
  }

  @Get('secretaries/:id')
  async getSecretary(@Param('id') id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!row) throw new NotFoundException();
    return mapUser(row);
  }

  @Post('secretaries')
  async createSecretary(@Body() body: Record<string, unknown>) {
    requireFields(body, ['email']);
    const role = await this.prisma.role.findFirst({
      where: { slug: 'secretary' },
    });
    if (!role) throw new BadRequestException('Secretary role not seeded');
    const row = await this.prisma.user.create({
      data: {
        firstName: body.firstName ? str(body.firstName) : null,
        lastName: body.lastName ? str(body.lastName) : null,
        email: str(body.email).trim().toLowerCase(),
        idRoles: role.id,
        timezone: body.timezone ? str(body.timezone) : 'UTC',
      },
    });
    return mapUser(row);
  }

  @Put('secretaries/:id')
  async updateSecretary(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: toBigInt(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.user.update({
      where: { id: toBigInt(id) },
      data: {
        ...(body.firstName !== undefined
          ? { firstName: str(body.firstName) }
          : {}),
        ...(body.lastName !== undefined
          ? { lastName: str(body.lastName) }
          : {}),
        ...(body.email !== undefined
          ? { email: str(body.email).trim().toLowerCase() }
          : {}),
      },
    });
    return mapUser(row);
  }

  @Delete('secretaries/:id')
  async deleteSecretary(@Param('id') id: string) {
    await this.prisma.user.deleteMany({ where: { id: toBigInt(id) } });
    return { ok: true };
  }

  // ─── Unavailabilities ──────────────────────────────────────────────────────

  @Get('unavailabilities')
  async listUnavailabilities(@Query('take') takeRaw?: string) {
    const take = clamp(takeRaw, 100, 50);
    const rows = await this.prisma.appointment.findMany({
      where: { isUnavailability: 1 },
      take,
      orderBy: { startDatetime: 'asc' },
    });
    return { items: rows.map(mapUnavailability) };
  }

  @Get('unavailabilities/:id')
  async getUnavailability(@Param('id') id: string) {
    const row = await this.prisma.appointment.findFirst({
      where: { id: toBigInt(id), isUnavailability: 1 },
    });
    if (!row) throw new NotFoundException();
    return mapUnavailability(row);
  }

  @Post('unavailabilities')
  async createUnavailability(@Body() body: Record<string, unknown>) {
    requireFields(body, ['start', 'end', 'providerId']);
    const row = await this.prisma.appointment.create({
      data: {
        bookDatetime: new Date(),
        startDatetime: new Date(str(body.start)),
        endDatetime: new Date(str(body.end)),
        notes: body.notes ? str(body.notes) : null,
        isUnavailability: 1,
        idUsersProvider: toBigInt(str(body.providerId)),
      },
    });
    return mapUnavailability(row);
  }

  @Put('unavailabilities/:id')
  async updateUnavailability(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id: toBigInt(id), isUnavailability: 1 },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.appointment.update({
      where: { id: toBigInt(id) },
      data: {
        ...(body.start !== undefined
          ? { startDatetime: new Date(str(body.start)) }
          : {}),
        ...(body.end !== undefined
          ? { endDatetime: new Date(str(body.end)) }
          : {}),
        ...(body.notes !== undefined ? { notes: str(body.notes) } : {}),
        ...(body.providerId !== undefined
          ? { idUsersProvider: toBigInt(str(body.providerId)) }
          : {}),
      },
    });
    return mapUnavailability(row);
  }

  @Delete('unavailabilities/:id')
  async deleteUnavailability(@Param('id') id: string) {
    await this.prisma.appointment.deleteMany({
      where: { id: toBigInt(id), isUnavailability: 1 },
    });
    return { ok: true };
  }

  // ─── Blocked periods ───────────────────────────────────────────────────────

  @Get('blocked-periods')
  async listBlockedPeriods(@Query('take') takeRaw?: string) {
    const take = clamp(takeRaw, 100, 50);
    const rows = await this.prisma.blockedPeriod.findMany({
      take,
      orderBy: { startDatetime: 'asc' },
    });
    return { items: rows.map(mapBlockedPeriod) };
  }

  @Get('blocked-periods/:id')
  async getBlockedPeriod(@Param('id') id: string) {
    const row = await this.prisma.blockedPeriod.findUnique({
      where: { id: Number(id) },
    });
    if (!row) throw new NotFoundException();
    return mapBlockedPeriod(row);
  }

  @Post('blocked-periods')
  async createBlockedPeriod(@Body() body: Record<string, unknown>) {
    requireFields(body, ['start', 'end']);
    const now = new Date();
    const row = await this.prisma.blockedPeriod.create({
      data: {
        name: body.name ? str(body.name) : null,
        startDatetime: new Date(str(body.start)),
        endDatetime: new Date(str(body.end)),
        notes: body.notes ? str(body.notes) : null,
        createDatetime: now,
        updateDatetime: now,
      },
    });
    return mapBlockedPeriod(row);
  }

  @Put('blocked-periods/:id')
  async updateBlockedPeriod(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.blockedPeriod.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.blockedPeriod.update({
      where: { id: Number(id) },
      data: {
        ...(body.name !== undefined ? { name: str(body.name) } : {}),
        ...(body.start !== undefined
          ? { startDatetime: new Date(str(body.start)) }
          : {}),
        ...(body.end !== undefined
          ? { endDatetime: new Date(str(body.end)) }
          : {}),
        ...(body.notes !== undefined ? { notes: str(body.notes) } : {}),
        updateDatetime: new Date(),
      },
    });
    return mapBlockedPeriod(row);
  }

  @Delete('blocked-periods/:id')
  async deleteBlockedPeriod(@Param('id') id: string) {
    await this.prisma.blockedPeriod.deleteMany({ where: { id: Number(id) } });
    return { ok: true };
  }

  // ─── Webhooks ──────────────────────────────────────────────────────────────

  @Get('webhooks')
  async listWebhooks() {
    const rows = await this.prisma.webhook.findMany({
      where: { isActive: 1 },
      orderBy: { id: 'asc' },
    });
    return { items: rows.map(mapWebhook) };
  }

  @Get('webhooks/:id')
  async getWebhook(@Param('id') id: string) {
    const row = await this.prisma.webhook.findUnique({
      where: { id: Number(id) },
    });
    if (!row) throw new NotFoundException();
    return mapWebhook(row);
  }

  @Post('webhooks')
  async createWebhook(@Body() body: Record<string, unknown>) {
    requireFields(body, ['name', 'url']);
    const now = new Date();
    const row = await this.prisma.webhook.create({
      data: {
        name: str(body.name).trim(),
        url: str(body.url).trim(),
        actions: body.actions ? str(body.actions) : null,
        secretToken: body.secretToken ? str(body.secretToken) : null,
        isActive: 1,
        isSslVerified: 1,
        notes: body.notes ? str(body.notes) : null,
        createDatetime: now,
        updateDatetime: now,
      },
    });
    return mapWebhook(row);
  }

  @Put('webhooks/:id')
  async updateWebhook(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const existing = await this.prisma.webhook.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) throw new NotFoundException();
    const row = await this.prisma.webhook.update({
      where: { id: Number(id) },
      data: {
        ...(body.name !== undefined ? { name: str(body.name).trim() } : {}),
        ...(body.url !== undefined ? { url: str(body.url).trim() } : {}),
        ...(body.actions !== undefined ? { actions: str(body.actions) } : {}),
        ...(body.secretToken !== undefined
          ? { secretToken: str(body.secretToken) }
          : {}),
        ...(body.notes !== undefined ? { notes: str(body.notes) } : {}),
        updateDatetime: new Date(),
      },
    });
    return mapWebhook(row);
  }

  @Delete('webhooks/:id')
  async deleteWebhook(@Param('id') id: string) {
    await this.prisma.webhook.deleteMany({ where: { id: Number(id) } });
    return { ok: true };
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  @Get('settings')
  async listSettings() {
    const rows = await this.prisma.setting.findMany({
      orderBy: { name: 'asc' },
    });
    return { items: rows.map((s) => ({ name: s.name, value: s.value })) };
  }

  @Put('settings')
  async updateSetting(@Body() body: Record<string, unknown>) {
    requireFields(body, ['name']);
    const name = str(body.name);
    const value = body.value !== undefined ? str(body.value) : null;
    const existing = await this.prisma.setting.findFirst({ where: { name } });
    if (existing) {
      await this.prisma.setting.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      await this.prisma.setting.create({ data: { name, value } });
    }
    return { name, value };
  }

  // ─── Availabilities ────────────────────────────────────────────────────────

  @Get('availabilities')
  async getAvailabilities(
    @Query('serviceId') serviceId?: string,
    @Query('providerId') providerId?: string,
    @Query('date') dateStr?: string,
  ) {
    if (!serviceId || !providerId || !dateStr) {
      throw new BadRequestException(
        'serviceId, providerId and date are required',
      );
    }
    const service = await this.prisma.service.findUnique({
      where: { id: toBigInt(serviceId) },
    });
    if (!service) throw new NotFoundException('Service not found');

    const date = new Date(dateStr);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const booked = await this.prisma.appointment.findMany({
      where: {
        idUsersProvider: toBigInt(providerId),
        isUnavailability: 0,
        startDatetime: { gte: dayStart, lte: dayEnd },
      },
    });

    const duration = service.duration ?? 30;
    const slots: string[] = [];
    const slotStart = new Date(dayStart);
    slotStart.setHours(9, 0, 0, 0);
    const slotEnd = new Date(dayStart);
    slotEnd.setHours(17, 0, 0, 0);

    while (slotStart < slotEnd) {
      const end = new Date(slotStart.getTime() + duration * 60_000);
      const overlaps = booked.some(
        (a) =>
          a.startDatetime &&
          a.endDatetime &&
          a.startDatetime < end &&
          a.endDatetime > slotStart,
      );
      if (!overlaps) {
        slots.push(slotStart.toISOString());
      }
      slotStart.setMinutes(slotStart.getMinutes() + duration);
    }

    return { date: dateStr, slots };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function clamp(
  raw: string | undefined,
  max: number,
  defaultVal: number,
): number {
  return Math.min(
    max,
    Math.max(1, Number.parseInt(raw ?? String(defaultVal), 10) || defaultVal),
  );
}

function toBigInt(id: string): bigint {
  try {
    return BigInt(id);
  } catch {
    throw new BadRequestException(`Invalid ID: ${id}`);
  }
}

/** Cast an unknown body field to string, allowing the linter to be satisfied. */
function str(v: unknown): string {
  return String(v as string);
}

function requireFields(body: Record<string, unknown>, fields: string[]) {
  for (const f of fields) {
    const v = body[f];
    if (v == null || String(v as string).trim() === '') {
      throw new BadRequestException(`${f} is required`);
    }
  }
}

type ServiceRow = {
  id: bigint;
  name: string | null;
  duration: number | null;
  price: { toString(): string } | null;
  currency: string | null;
  description: string | null;
  idServiceCategories: bigint | null;
  category?: { name: string | null } | null;
  attendantsNumber: number | null;
};

function mapService(s: ServiceRow) {
  return {
    id: s.id.toString(),
    name: s.name,
    duration: s.duration,
    price: s.price != null ? s.price.toString() : null,
    currency: s.currency,
    description: s.description,
    categoryId: s.idServiceCategories?.toString() ?? null,
    categoryName: s.category?.name ?? null,
    attendantsNumber: s.attendantsNumber,
  };
}

type UserRow = {
  id: bigint;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  timezone: string | null;
};

function mapUser(u: UserRow) {
  return {
    id: u.id.toString(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    timezone: u.timezone,
  };
}

type AppointmentRow = {
  id: bigint;
  startDatetime: Date | null;
  endDatetime: Date | null;
  bookDatetime: Date | null;
  notes: string | null;
  idUsersProvider: bigint | null;
  idUsersCustomer: bigint | null;
  idServices: bigint | null;
};

function mapAppointment(a: AppointmentRow) {
  return {
    id: a.id.toString(),
    start: a.startDatetime?.toISOString() ?? null,
    end: a.endDatetime?.toISOString() ?? null,
    book: a.bookDatetime?.toISOString() ?? null,
    notes: a.notes,
    providerId: a.idUsersProvider?.toString() ?? null,
    customerId: a.idUsersCustomer?.toString() ?? null,
    serviceId: a.idServices?.toString() ?? null,
  };
}

function mapUnavailability(a: AppointmentRow) {
  return {
    id: a.id.toString(),
    start: a.startDatetime?.toISOString() ?? null,
    end: a.endDatetime?.toISOString() ?? null,
    notes: a.notes,
    providerId: a.idUsersProvider?.toString() ?? null,
  };
}

type BlockedPeriodRow = {
  id: number;
  name: string | null;
  startDatetime: Date | null;
  endDatetime: Date | null;
  notes: string | null;
};

function mapBlockedPeriod(b: BlockedPeriodRow) {
  return {
    id: b.id,
    name: b.name,
    start: b.startDatetime?.toISOString() ?? null,
    end: b.endDatetime?.toISOString() ?? null,
    notes: b.notes,
  };
}

type WebhookRow = {
  id: number;
  name: string;
  url: string;
  actions: string | null;
  secretToken: string | null;
  isActive: number;
  isSslVerified: number;
  notes: string | null;
};

function mapWebhook(w: WebhookRow) {
  return {
    id: w.id,
    name: w.name,
    url: w.url,
    actions: w.actions,
    secretToken: w.secretToken,
    isActive: w.isActive === 1,
    isSslVerified: w.isSslVerified === 1,
    notes: w.notes,
  };
}
