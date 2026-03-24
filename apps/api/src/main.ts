import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { csrfMiddleware } from './csrf/csrf.middleware';
import { PrismaConnectionExceptionFilter } from './prisma/prisma-connection.exception-filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useGlobalFilters(new PrismaConnectionExceptionFilter());

  app.use(helmet());
  app.use(cookieParser());
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
