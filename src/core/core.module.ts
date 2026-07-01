import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { configModuleOptions } from './config';
import {
  EncryptionService,
  ErrorService,
  RequestContextService,
} from './services';
import { ShopifySessionGuard, WebhookHmacGuard } from './guards';
import { GlobalExceptionFilter } from './filters';
import { LoggingInterceptor } from './interceptors';
import { RequestIdMiddleware } from './middleware';

/**
 * Global core module. Provides cross-cutting infrastructure:
 *  - Config (with Joi validation)
 *  - Encryption / error / request-context services
 *  - Global ShopifySessionGuard (replaces JWT), GlobalExceptionFilter,
 *    LoggingInterceptor
 *  - WebhookHmacGuard (applied per-route by feature modules)
 *
 * (PlanLimitGuard lives in StoreModule — it depends on StoreService.)
 *
 * Anything exported here is available app-wide without re-importing.
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot(configModuleOptions)],
  providers: [
    // Services
    EncryptionService,
    ErrorService,
    RequestContextService,

    // Guards available for per-route use by feature modules
    WebhookHmacGuard,

    // Globally-applied providers
    { provide: APP_GUARD, useClass: ShopifySessionGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  exports: [
    EncryptionService,
    ErrorService,
    RequestContextService,
    WebhookHmacGuard,
  ],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Correlation id on every request.
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
