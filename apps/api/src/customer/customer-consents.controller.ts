import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomerAuthGuard,
  type RequestWithCustomer,
} from '../auth/customer-auth.guard';

type ConsentBody = { type?: string };

@Controller('customer/consents')
@UseGuards(CustomerAuthGuard)
export class CustomerConsentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: RequestWithCustomer) {
    const customerId = BigInt(req.customerUser.customerId);

    const rows = await this.prisma.consent.findMany({
      where: { idUsers: customerId },
      orderBy: { createDatetime: 'desc' },
    });

    return {
      items: rows.map((c) => ({
        id: c.id,
        type: c.type,
        ip: c.ip,
        createdAt: c.createDatetime?.toISOString() ?? null,
      })),
    };
  }

  @Post()
  async create(
    @Req() req: RequestWithCustomer & Request,
    @Body() body: ConsentBody,
  ) {
    const type = (body?.type ?? 'terms').trim();
    if (!type) throw new BadRequestException('type is required');

    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded)
        ?.split(',')[0]
        ?.trim() ??
      req.socket?.remoteAddress ??
      '0.0.0.0';

    const customerId = BigInt(req.customerUser.customerId);
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: { email: true, firstName: true, lastName: true },
    });

    const consent = await this.prisma.consent.create({
      data: {
        type,
        ip,
        idUsers: customerId,
        email: user?.email ?? null,
        firstName: user?.firstName ?? null,
        lastName: user?.lastName ?? null,
      },
    });

    return { id: consent.id, ok: true };
  }
}
