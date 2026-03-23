import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to MySQL');
    } catch (e) {
      this.logger.warn(
        `Prisma could not connect (${e instanceof Error ? e.message : String(e)}). Auth and DB-backed routes will fail until DATABASE_URL is valid.`,
      );
    }
  }
}
