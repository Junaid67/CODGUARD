import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { CoreModule } from './core';
import { DatabaseModule } from './database/database.module';
import { SharedModule } from './shared';
import { StoreModule } from './module/store/store.module';
import { AuditModule } from './module/audit/audit.module';
import { ContributionsModule } from './module/contributions/contributions.module';
import { RiskModule } from './module/risk/risk.module';
import { ShopifyAuthModule } from './module/shopify-auth/shopify-auth.module';
import { OnboardingModule } from './module/onboarding/onboarding.module';
import { BillingModule } from './module/billing/billing.module';
import { OrdersModule } from './module/orders/orders.module';
import { WebhooksModule } from './module/webhooks/webhooks.module';
import { ScanModule } from './module/scan/scan.module';
import { ReconciliationModule } from './module/reconciliation/reconciliation.module';

/**
 * Root application module.
 *
 * Wired in:
 *  - CoreModule (@Global) → config (Joi), guards (global ShopifySessionGuard),
 *    GlobalExceptionFilter, LoggingInterceptor, RequestIdMiddleware,
 *    encryption service                                                    [step 2 ✓]
 *  - DatabaseModule (TypeORM/PostgreSQL)                                   [step 3 ✓]
 *  - SharedModule (@Global) → pipes, exceptions, DTOs, utils, constants     [step 4 ✓]
 *
 * Feature modules (added one by one in dependency order):
 *  - StoreModule                                                           [step 5 ✓]
 *  - AuditModule (@Global)                                                 [step 5 ✓]
 *  - ContributionsModule                                                   [step 5 ✓]
 *  - RiskModule                                                            [step 5 ✓]
 *  - ShopifyAuthModule                                                     [step 5 ✓]
 *  - OnboardingModule                                                      [step 5 ✓]
 *  - BillingModule                                                         [step 5 ✓]
 *  - OrdersModule (built before Webhooks — webhooks depends on it)         [step 5 ✓]
 *  - WebhooksModule                                                        [step 5 ✓]
 *  - ScanModule                                                            [step 5 ✓]
 *
 * All feature modules complete.
 */
@Module({
  imports: [
    CoreModule,
    DatabaseModule,
    SharedModule,
    ScheduleModule.forRoot(),
    StoreModule,
    AuditModule,
    ContributionsModule,
    RiskModule,
    ShopifyAuthModule,
    OnboardingModule,
    BillingModule,
    OrdersModule,
    WebhooksModule,
    ScanModule,
    ReconciliationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
