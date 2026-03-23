import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Controller('stripe')
export class StripeWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  /** Stripe sends raw JSON; signature verification requires `req.rawBody`. */
  @Post('webhook')
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!secret || !apiKey) {
      throw new ServiceUnavailableException(
        'Stripe webhook is not configured (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET)',
      );
    }
    const raw = req.rawBody;
    if (!raw || !Buffer.isBuffer(raw)) {
      throw new BadRequestException('Missing raw body for Stripe signature');
    }
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const stripe = new Stripe(apiKey);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, signature, secret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
    });
    if (existing) {
      return { received: true, duplicate: true };
    }

    await this.prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        eventType: event.type,
      },
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        id: string;
        payment_intent?: string | null;
        metadata?: Record<string, string> | null;
      };
      const sessionId = session.id;
      const paymentIntentId = session.payment_intent ?? null;
      const appointmentIdStr = session.metadata?.appointmentId;

      await this.prisma.appointmentPayment.updateMany({
        where: { stripeCheckoutSessionId: sessionId },
        data: {
          status: 'succeeded',
          stripeEventId: event.id,
          ...(paymentIntentId
            ? { stripePaymentIntentId: paymentIntentId }
            : {}),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'stripe_checkout_completed',
          metadata: JSON.stringify({
            sessionId,
            appointmentId: appointmentIdStr,
            paymentIntentId,
          }),
        },
      });
    } else if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as { id: string };
      await this.prisma.appointmentPayment.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: { status: 'succeeded', stripeEventId: event.id },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'stripe_webhook',
        metadata: JSON.stringify({ type: event.type, id: event.id }),
      },
    });

    return { received: true };
  }
}
