/**
 * Background worker for BullMQ (run beside the API in production).
 *
 * Usage: `pnpm run worker` from apps/api (requires REDIS_URL).
 */
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { sendBookingConfirmation } from './email.service';

const url = process.env.REDIS_URL?.trim();
if (!url) {
  console.error('REDIS_URL is not set; worker exiting.');
  process.exit(1);
}

const prisma = new PrismaClient();

const worker = new Worker(
  'openbook',
  async (job) => {
    if (job.name === 'booking-confirmation') {
      const appointmentId = (job.data as { appointmentId?: string })
        .appointmentId;
      await handleBookingConfirmation(appointmentId ?? '');
    }

    if (job.name === 'webhook-dispatch') {
      const { event, appointmentId } = job.data as {
        event: string;
        appointmentId: string;
      };
      await dispatchWebhooks(event, appointmentId);
    }

    if (job.name === 'geonames-import') {
      const data = job.data as { source?: string; countryCode?: string };
      console.log(
        `[openbook] geonames-import queued (source=${data.source ?? 'unknown'}, country=${data.countryCode ?? 'all'})`,
      );
      await prisma.auditLog.create({
        data: {
          action: 'geonames_import_job',
          metadata: JSON.stringify(data ?? {}),
        },
      });
    }

    await Promise.resolve();
  },
  {
    connection: {
      url,
      maxRetriesPerRequest: null,
    },
  },
);

async function handleBookingConfirmation(appointmentId: string): Promise<void> {
  if (!appointmentId) return;

  const appointment = await prisma.appointment.findUnique({
    where: { id: BigInt(appointmentId) },
    include: {
      service: { select: { name: true } },
      provider: { select: { firstName: true, lastName: true, email: true } },
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!appointment) {
    console.warn(
      `[openbook] booking-confirmation: appointment ${appointmentId} not found`,
    );
    return;
  }

  const companySetting = await prisma.setting.findFirst({
    where: { name: 'company_name' },
  });
  const companyName = companySetting?.value ?? 'OpenBook';

  const customerEmail = appointment.customer?.email;
  if (!customerEmail) {
    console.warn(
      `[openbook] booking-confirmation: no customer email for appointment ${appointmentId}`,
    );
    return;
  }

  const customerName =
    [appointment.customer?.firstName, appointment.customer?.lastName]
      .filter(Boolean)
      .join(' ') || 'Customer';

  const providerName =
    [appointment.provider?.firstName, appointment.provider?.lastName]
      .filter(Boolean)
      .join(' ') || 'Provider';

  try {
    await sendBookingConfirmation({
      companyName,
      customerEmail,
      customerName,
      providerEmail: appointment.provider?.email ?? null,
      providerName,
      serviceName: appointment.service?.name ?? 'Appointment',
      startDatetime:
        appointment.startDatetime?.toISOString() ?? new Date().toISOString(),
      appointmentId,
    });

    await prisma.auditLog.create({
      data: {
        action: 'booking_confirmation_sent',
        metadata: JSON.stringify({ appointmentId }),
      },
    });
    console.log(
      `[openbook] booking-confirmation emails sent for appointment ${appointmentId}`,
    );
  } catch (err) {
    await prisma.auditLog.create({
      data: {
        action: 'booking_confirmation_failed',
        metadata: JSON.stringify({ appointmentId, error: String(err) }),
      },
    });
    throw err; // BullMQ will retry
  }
}

async function dispatchWebhooks(event: string, appointmentId: string) {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: 1 },
  });

  for (const hook of webhooks) {
    if (hook.actions && !hook.actions.includes(event)) {
      continue;
    }

    const payload = JSON.stringify({
      event,
      appointmentId,
      timestamp: new Date().toISOString(),
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-OpenBook-Event': event,
    };
    if (hook.secretToken) {
      const { createHmac } = await import('crypto');
      headers['X-OpenBook-Signature'] = createHmac('sha256', hook.secretToken)
        .update(payload)
        .digest('hex');
    }

    try {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: AbortSignal.timeout(10_000),
      });
      await prisma.auditLog.create({
        data: {
          action: 'webhook_dispatch',
          metadata: JSON.stringify({
            webhookId: hook.id,
            event,
            appointmentId,
            status: res.status,
          }),
        },
      });
    } catch (err) {
      await prisma.auditLog.create({
        data: {
          action: 'webhook_dispatch_failed',
          metadata: JSON.stringify({
            webhookId: hook.id,
            event,
            appointmentId,
            error: String(err),
          }),
        },
      });
      throw err; // BullMQ will retry
    }
  }
}

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});

void worker.waitUntilReady().then(() => {
  console.log('OpenBook worker listening on queue "openbook"');
});
