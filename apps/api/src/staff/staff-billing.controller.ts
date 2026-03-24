import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import Stripe from 'stripe';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { can, canView } from '../auth/permissions.ea';
import { PrismaService } from '../prisma/prisma.service';

@Controller('staff/billing')
@UseGuards(StaffAuthGuard)
export class StaffBillingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  async summary(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    const webhookEvents = await this.prisma.stripeWebhookEvent.count();
    const [succeededCount, pendingCount, refundedCount, failedCount] =
      await Promise.all([
        this.prisma.appointmentPayment.count({
          where: { status: 'succeeded' },
        }),
        this.prisma.appointmentPayment.count({
          where: { status: 'pending' },
        }),
        this.prisma.appointmentPayment.count({
          where: { status: 'refunded' },
        }),
        this.prisma.appointmentPayment.count({
          where: { status: 'failed' },
        }),
      ]);
    return {
      ok: true,
      stripe: {
        configured: Boolean(process.env.STRIPE_SECRET_KEY),
        webhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        mode: process.env.STRIPE_MODE ?? null,
        webhookEventsReceived: webhookEvents,
      },
      jobs: {
        redisConfigured: Boolean(process.env.REDIS_URL),
      },
      payments: {
        succeededCount,
        pendingCount,
        refundedCount,
        failedCount,
        totalCount:
          succeededCount + pendingCount + refundedCount + failedCount,
      },
      message: 'Stripe payments tracked in ea_appointment_payments.',
    };
  }

  @Get('transactions')
  async transactions(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    const rows = await this.prisma.appointmentPayment.findMany({
      take: 100,
      orderBy: { id: 'desc' },
      include: {
        appointment: {
          include: {
            service: true,
            customer: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
    return {
      items: rows.map((p) => ({
        id: p.id,
        appointmentId: p.idAppointments.toString(),
        amount: p.amount?.toString() ?? null,
        currency: p.currency,
        status: p.status,
        stripePaymentIntentId: p.stripePaymentIntentId,
        stripeCheckoutSessionId: p.stripeCheckoutSessionId,
        createdAt: p.createDatetime?.toISOString() ?? null,
        serviceName: p.appointment?.service?.name ?? null,
        customerName:
          [
            p.appointment?.customer?.firstName,
            p.appointment?.customer?.lastName,
          ]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          p.appointment?.customer?.email ||
          null,
      })),
    };
  }

  /** Staff-initiated refund for any appointment payment. */
  @Post('refund/:paymentId')
  async refund(
    @Req() req: RequestWithStaff,
    @Param('paymentId') paymentId: string,
  ) {
    if (!can(req.staffUser.permissions, 'system_settings', 'edit')) {
      throw new ForbiddenException();
    }
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
    const payment = await this.prisma.appointmentPayment.findUnique({
      where: { id: Number(paymentId) },
    });
    if (
      !payment ||
      payment.status !== 'succeeded' ||
      !payment.stripePaymentIntentId
    ) {
      throw new NotFoundException('No refundable payment found');
    }
    const stripe = new Stripe(apiKey);
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
    });
    await this.prisma.appointmentPayment.update({
      where: { id: payment.id },
      data: { status: 'refunded' },
    });
    await this.prisma.auditLog.create({
      data: {
        action: 'staff_refund',
        metadata: JSON.stringify({
          paymentId: payment.id,
          refundId: refund.id,
        }),
      },
    });
    return { ok: true, refundId: refund.id };
  }
}
