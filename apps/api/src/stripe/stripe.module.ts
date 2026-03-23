import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeCheckoutController } from './stripe-checkout.controller';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [StripeWebhookController, StripeCheckoutController],
})
export class StripeModule {}
