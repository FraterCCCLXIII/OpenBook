import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomerAuthGuard,
  type RequestWithCustomer,
} from '../auth/customer-auth.guard';

/** Refunds: staff-only (`POST /api/staff/billing/refund/:paymentId`). */
@Controller('stripe')
export class StripeCheckoutController {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a Stripe Checkout session for an appointment. */
  @Post('checkout')
  @UseGuards(CustomerAuthGuard)
  async createCheckout(
    @Req() req: RequestWithCustomer,
    @Body()
    body: { appointmentId?: string; successUrl?: string; cancelUrl?: string },
  ) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Stripe is not configured (STRIPE_SECRET_KEY)',
      );
    }
    if (!body.appointmentId) {
      throw new BadRequestException('appointmentId is required');
    }

    const appointmentId = BigInt(body.appointmentId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        idUsersCustomer: BigInt(req.customerUser.customerId),
      },
      include: { service: true },
    });
    if (!appointment) {
      throw new BadRequestException('Appointment not found or not yours');
    }
    if (!appointment.service?.price) {
      throw new BadRequestException('This service has no price configured');
    }

    const stripe = new Stripe(apiKey);
    const priceInCents = Math.round(Number(appointment.service.price) * 100);
    const currency = (appointment.service.currency ?? 'usd').toLowerCase();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: appointment.service.name ?? 'Appointment',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url:
        body.successUrl ??
        `${process.env.APP_URL ?? 'http://localhost:5173'}/customer/bookings`,
      cancel_url:
        body.cancelUrl ??
        `${process.env.APP_URL ?? 'http://localhost:5173'}/customer/bookings`,
      metadata: { appointmentId: appointmentId.toString() },
    });

    await this.prisma.appointmentPayment.create({
      data: {
        idAppointments: appointmentId,
        amount: appointment.service.price,
        currency: appointment.service.currency,
        status: 'pending',
        stripeCheckoutSessionId: session.id,
      },
    });

    return { sessionId: session.id, url: session.url };
  }
}
