import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { json as expressJson, urlencoded as expressUrlencoded } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { csrfMiddleware } from './csrf/csrf.middleware';
import { PrismaConnectionExceptionFilter } from './prisma/prisma-connection.exception-filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Disable built-in body parsers so we can configure them manually.
    // This prevents the default rawBody middleware from buffering multipart
    // request streams before multer can process file uploads.
    bodyParser: false,
  });
  app.useGlobalFilters(new PrismaConnectionExceptionFilter());

  app.use(helmet());
  app.use(cookieParser());

  // Custom body parsers — skip multipart so multer handles file uploads unimpeded.
  // For JSON/urlencoded requests, capture req.rawBody (needed for Stripe webhook
  // signature verification via the RawBodyRequest type in the webhook controller).
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ct = (req.headers['content-type'] ?? '').toLowerCase();
    if (ct.startsWith('multipart/')) return next();
    expressJson({
      limit: '50mb',
      verify: (r: any, _res, buf) => { r.rawBody = buf; },
    })(req, res, (err?: unknown) => {
      if (err) return next(err);
      expressUrlencoded({
        extended: true,
        limit: '10mb',
        verify: (r: any, _res, buf) => { if (!r.rawBody) r.rawBody = buf; },
      })(req, res, next);
    });
  });

  app.use(csrfMiddleware);
  const defaultOrigins = [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    // Vite preview (Playwright CI + local `CI=true`)
    'http://127.0.0.1:5174',
    'http://localhost:5174',
  ];
  app.enableCors({
    origin:
      process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ??
      defaultOrigins,
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api`);
}

void bootstrap();
