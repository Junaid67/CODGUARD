import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, ValidationError } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { CONSTANTS } from './app.constants';
import { setupSwagger } from './swagger';
import { TrimPipe } from './shared/pipes';
import { ValidationFailedException } from './shared/exceptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // REQUIRED for HMAC webhook verification (raw body preserved).
    rawBody: true,
  });

  const logger = new Logger('Bootstrap');

  // Secure HTTP headers
  app.use(helmet());

  // Swagger UI uses inline scripts/styles, which helmet's default CSP blocks
  // (the page would render blank). Relax CSP for the docs routes only — all
  // other routes keep the strict policy.
  app.use(['/docs', '/docs-json'], helmet({ contentSecurityPolicy: false }));

  // Rate limiting — enabled in production only (§7.5). Disabled in dev so local
  // testing isn't throttled. Set RATE_LIMIT_MAX to override the cap if needed.
  if (process.env.NODE_ENV === 'production') {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: process.env.RATE_LIMIT_MAX
          ? parseInt(process.env.RATE_LIMIT_MAX, 10)
          : 100,
        message: {
          errors: [{ name: 'RATE_LIMITED', message: 'Too many requests' }],
        },
      }),
    );
  }

  // CORS — only allow Shopify admin and the app domain
  app.enableCors({
    origin: process.env.CORS_WHITELIST?.split(',') ?? [],
    credentials: true,
  });

  // Body limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Global prefix
  app.setGlobalPrefix(CONSTANTS.API_VERSION);

  // Global pipes: trim string inputs, then validate. Validation failures are
  // shaped into the standard error envelope via ValidationFailedException.
  app.useGlobalPipes(new TrimPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationFailedException(errors),
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  logger.log(`${CONSTANTS.APP_NAME} listening on port ${port}`);
}

bootstrap();
