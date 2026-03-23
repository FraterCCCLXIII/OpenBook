import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  StaffAuthGuard,
  type RequestWithStaff,
} from '../auth/staff-auth.guard';
import { canView } from '../auth/permissions.ea';
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
      message:
        'Stripe webhooks write to openbook_stripe_events (idempotent). Billing UI: extend with Checkout/refunds as needed.',
    };
  }
}
