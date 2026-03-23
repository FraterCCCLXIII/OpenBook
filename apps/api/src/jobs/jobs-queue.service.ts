import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

const QUEUE_NAME = 'openbook';

@Injectable()
export class JobsQueueService implements OnModuleDestroy {
  private readonly log = new Logger(JobsQueueService.name);
  private readonly queue: Queue | null;

  constructor() {
    const url = process.env.REDIS_URL?.trim();
    if (!url) {
      this.queue = null;
      return;
    }
    this.queue = new Queue(QUEUE_NAME, {
      connection: {
        url,
        maxRetriesPerRequest: null,
      },
    });
  }

  async enqueueBookingConfirmation(appointmentId: string): Promise<void> {
    if (!this.queue) {
      this.log.debug('REDIS_URL not set; skip booking-confirmation job');
      return;
    }
    await this.queue.add(
      'booking-confirmation',
      { appointmentId },
      { removeOnComplete: 100, removeOnFail: 500 },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }
}
