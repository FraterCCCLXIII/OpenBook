import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';

/**
 * Maps Prisma DB connectivity failures to 503 with a clear message (avoids opaque 500 on login).
 */
@Catch(PrismaClientInitializationError, PrismaClientKnownRequestError)
export class PrismaConnectionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaConnectionExceptionFilter.name);

  catch(
    exception:
      | PrismaClientInitializationError
      | PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ) {
    const isConn =
      exception instanceof PrismaClientInitializationError ||
      (exception instanceof PrismaClientKnownRequestError &&
        (exception.code === 'P1001' ||
          exception.code === 'P1002' ||
          exception.code === 'P1017'));

    if (!isConn) {
      throw exception;
    }

    this.logger.warn(
      `Database unavailable (${exception instanceof PrismaClientKnownRequestError ? exception.code : 'init'}): ${exception.message}`,
    );

    const res = host.switchToHttp().getResponse<Response>();
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'Service Unavailable',
      message:
        'Database connection failed. Ensure MySQL is running (e.g. `docker compose up -d mysql`) and DATABASE_URL matches (host API: `127.0.0.1:3306`; API in Docker: use hostname `mysql`).',
    });
  }
}
