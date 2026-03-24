import {
  BadRequestException,
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
    const [
      succeededCount,
      pendingCount,
      refundedCount,
      failedCount,
      partiallyRefundedCount,
    ] = await Promise.all([
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
      this.prisma.appointmentPayment.count({
        where: { status: 'partially_refunded' },
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
        partiallyRefundedCount,
        failedCount,
        totalCount:
          succeededCount +
          pendingCount +
          refundedCount +
          partiallyRefundedCount +
          failedCount,
      },
      message: 'Stripe payments tracked in ea_appointment_payments.',
    };
  }

  @Get('transactions')
  async transactions(@Req() req: RequestWithStaff) {
    if (!canView(req.staffUser.permissions, 'system_settings')) {
      throw new ForbiddenException();
    }
    const apiKey = process.env.STRIPE_SECRET_KEY;
    const stripe = apiKey ? new Stripe(apiKey) : null;

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

    const items = await Promise.all(
      rows.map(async (p) => ({
        id: p.id,
        appointmentId: p.idAppointments.toString(),
        amount: p.amount?.toString() ?? null,
        currency: p.currency,
        status: p.status,
        stripePaymentIntentId: p.stripePaymentIntentId,
        stripeCheckoutSessionId: p.stripeCheckoutSessionId,
        receiptUrl: stripe
          ? await this.stripeReceiptUrl(stripe, p.stripePaymentIntentId)
          : null,
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
    );

    return { items };
  }

  private async stripeReceiptUrl(
    stripe: Stripe,
    paymentIntentId: string | null,
  ): Promise<string | null> {
    if (!paymentIntentId) return null;
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge'],
      });
      const ch = pi.latest_charge;
      if (typeof ch === 'object' && ch && 'receipt_url' in ch) {
        return (ch as Stripe.Charge).receipt_url ?? null;
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Staff-initiated refund. Optional `amountCents` issues a partial refund (Stripe smallest currency unit).
   */
  @Post('refund/:paymentId')
  async refund(
    @Req() req: RequestWithStaff,
    @Param('paymentId') paymentId: string,
    @Body() body: { amountCents?: number },
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
      !payment.stripePaymentIntentId ||
      (payment.status !== 'succeeded' && payment.status !== 'partially_refunded')
    ) {
      throw new NotFoundException('No refundable payment found');
    }

    const stripe = new Stripe(apiKey);
    const piBefore = await stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId,
      { expand: ['latest_charge'] },
    );
    const lc = piBefore.latest_charge;
    if (typeof lc !== 'object' || !lc || !('amount_refunded' in lc)) {
      throw new BadRequestException(
        'Could not load Stripe charge; retry or check PaymentIntent.',
      );
    }
    const chargeBefore = lc as Stripe.Charge;
    const alreadyRefunded = chargeBefore.amount_refunded ?? 0;
    const total = piBefore.amount_received ?? 0;
    const remaining = Math.max(0, total - alreadyRefunded);

    const amountCents = body.amountCents;
    if (amountCents != null) {
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        throw new BadRequestException('amountCents must be a positive number');
      }
      if (amountCents > remaining) {
        throw new BadRequestException(
          'Refund amount exceeds remaining refundable balance',
        );
      }
    }

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: payment.stripePaymentIntentId,
    };
    if (amountCents != null) {
      refundParams.amount = Math.floor(amountCents);
    }

    const refund = await stripe.refunds.create(refundParams);

    const pi = await stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId,
      { expand: ['latest_charge'] },
    );
    const charge = pi.latest_charge as Stripe.Charge;
    const refunded = charge.amount_refunded ?? 0;
    let nextStatus = payment.status;
    if (refunded >= total) {
      nextStatus = 'refunded';
    } else if (refunded > 0) {
      nextStatus = 'partially_refunded';
    }

    await this.prisma.appointmentPayment.update({
      where: { id: payment.id },
      data: { status: nextStatus },
    });
    await this.prisma.auditLog.create({
      data: {
        action: 'staff_refund',
        metadata: JSON.stringify({
          paymentId: payment.id,
          refundId: refund.id,
          amountCents: refund.amount,
          status: nextStatus,
        }),
      },
    });
    return {
      ok: true,
      refundId: refund.id,
      status: nextStatus,
      amountRefundedCents: refunded,
    };
  }
}
