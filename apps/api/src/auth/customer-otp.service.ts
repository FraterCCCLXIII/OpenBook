import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300;
const MAX_ATTEMPTS = 3;
const ATTEMPT_WINDOW_SECONDS = 600;
const LOCKOUT_SECONDS = 300;

@Injectable()
export class CustomerOtpService {
  constructor(private readonly prisma: PrismaService) {}

  async requestCode(email: string): Promise<string> {
    const normalized = email.trim().toLowerCase();
    const now = new Date();

    const record = await this.prisma.customerOtp.findFirst({
      where: { email: normalized },
    });

    if (record?.lockoutUntil && record.lockoutUntil > now) {
      throw new HttpException(
        'Account is temporarily locked. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const sendWindowStart = record?.sendWindowStartedAt;
    const windowExpired =
      !sendWindowStart ||
      now.getTime() - sendWindowStart.getTime() > ATTEMPT_WINDOW_SECONDS * 1000;

    const sendCount = windowExpired ? 0 : (record?.sendCount ?? 0);

    if (sendCount >= MAX_ATTEMPTS) {
      const lockoutUntil = new Date(now.getTime() + LOCKOUT_SECONDS * 1000);
      await this.prisma.customerOtp.upsert({
        where: record ? { id: record.id } : { id: -1 },
        create: { email: normalized, lockoutUntil, sendCount },
        update: { lockoutUntil },
      });
      throw new HttpException(
        'Account is temporarily locked. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.generateCode();
    const codeHash = await this.hashCode(code);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_SECONDS * 1000);

    const data = {
      email: normalized,
      codeHash,
      expiresAt,
      sendCount: sendCount + 1,
      sendWindowStartedAt: windowExpired
        ? now
        : (record?.sendWindowStartedAt ?? now),
      lastSendAt: now,
      attemptCount: 0,
      attemptWindowStartedAt: now,
      lockoutUntil: null as Date | null,
    };

    if (record) {
      await this.prisma.customerOtp.update({ where: { id: record.id }, data });
    } else {
      await this.prisma.customerOtp.create({ data });
    }

    return code;
  }

  async verifyCode(email: string, code: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const now = new Date();

    const record = await this.prisma.customerOtp.findFirst({
      where: { email: normalized },
    });

    if (!record) {
      throw new BadRequestException('Invalid verification code.');
    }

    if (record.lockoutUntil && record.lockoutUntil > now) {
      throw new HttpException(
        'Account is temporarily locked. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const windowExpired =
      !record.attemptWindowStartedAt ||
      now.getTime() - record.attemptWindowStartedAt.getTime() >
        ATTEMPT_WINDOW_SECONDS * 1000;

    const attemptCount = windowExpired ? 0 : record.attemptCount;

    const isExpired =
      !record.expiresAt || record.expiresAt < now || !record.codeHash;
    const isValid =
      !isExpired && (await this.verifyHash(code, record.codeHash!));

    if (!isValid) {
      const newAttemptCount = attemptCount + 1;
      const lockoutUntil =
        newAttemptCount >= MAX_ATTEMPTS
          ? new Date(now.getTime() + LOCKOUT_SECONDS * 1000)
          : null;

      await this.prisma.customerOtp.update({
        where: { id: record.id },
        data: {
          attemptCount: newAttemptCount,
          attemptWindowStartedAt: windowExpired
            ? now
            : record.attemptWindowStartedAt,
          lastAttemptAt: now,
          lockoutUntil,
        },
      });

      throw new BadRequestException('Invalid or expired verification code.');
    }

    await this.prisma.customerOtp.update({
      where: { id: record.id },
      data: {
        codeHash: null,
        expiresAt: null,
        attemptCount: 0,
        lastAttemptAt: now,
        lockoutUntil: null,
      },
    });
  }

  private generateCode(): string {
    const max = 10 ** OTP_LENGTH - 1;
    const n = Math.floor(Math.random() * (max + 1));
    return String(n).padStart(OTP_LENGTH, '0');
  }

  private async hashCode(code: string): Promise<string> {
    return bcryptjs.hash(code, 10);
  }

  private async verifyHash(code: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(code, hash);
  }
}
