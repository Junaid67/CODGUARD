import { Module } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { OrdersModule } from '../orders/orders.module';
import { StoreModule } from '../store/store.module';
import { ShopifyAuthModule } from '../shopify-auth/shopify-auth.module';

/**
 * Scheduled safety synchronization (§8): a cron job that re-reads recently
 * updated orders for every onboarded store and reconciles missed webhook
 * events. Requires ScheduleModule.forRoot() (registered in AppModule).
 */
@Module({
  imports: [OrdersModule, StoreModule, ShopifyAuthModule],
  providers: [ReconciliationService],
})
export class ReconciliationModule {}
