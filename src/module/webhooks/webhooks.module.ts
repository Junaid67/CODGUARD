import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { OrderCreatedHandler } from './handlers/order-created.handler';
import { OrderCancelledHandler } from './handlers/order-cancelled.handler';
import { RefundCreatedHandler } from './handlers/refund-created.handler';
import { AppUninstalledHandler } from './handlers/app-uninstalled.handler';
import { SubscriptionUpdatedHandler } from './handlers/subscription-updated.handler';
import { RiskModule } from '../risk/risk.module';
import { OrdersModule } from '../orders/orders.module';
import { StoreModule } from '../store/store.module';
import { BillingModule } from '../billing/billing.module';

/**
 * All Shopify webhook handlers (§11). Wires the handlers to the domain
 * services they orchestrate. WebhookHmacGuard comes from the global CoreModule;
 * AuditService is global.
 */
@Module({
  imports: [RiskModule, OrdersModule, StoreModule, BillingModule],
  controllers: [WebhooksController],
  providers: [
    OrderCreatedHandler,
    OrderCancelledHandler,
    RefundCreatedHandler,
    AppUninstalledHandler,
    SubscriptionUpdatedHandler,
  ],
})
export class WebhooksModule {}
