/**
 * Background worker for BullMQ (run beside the API in production).
 *
 * Usage: `pnpm run worker` from apps/api (requires REDIS_URL).
 */
import { Worker } from 'bullmq';

const url = process.env.REDIS_URL?.trim();
if (!url) {
  console.error('REDIS_URL is not set; worker exiting.');
  process.exit(1);
}

const worker = new Worker(
  'openbook',
  async (job) => {
    if (job.name === 'booking-confirmation') {
      const appointmentId = (job.data as { appointmentId?: string })
        .appointmentId;
      console.log(
        `[openbook] booking-confirmation job (appointment ${appointmentId ?? '?'}) — hook email/SMS here`,
      );
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

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});

void worker.waitUntilReady().then(() => {
  console.log('OpenBook worker listening on queue "openbook"');
});
