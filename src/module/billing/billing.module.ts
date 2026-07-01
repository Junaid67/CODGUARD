import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingEntity } from './entity/billing.entity';
import { BillingRepository } from './billing.repository';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { StoreModule } from '../store/store.module';
import { ShopifyAuthModule } from '../shopify-auth/shopify-auth.module';

/**
 * Shopify Billing API integration (§13). Depends on StoreModule (plan updates)
 * and ShopifyAuthModule (the shared ShopifyService client). Exports
 * BillingService so the webhooks module can sync subscription updates.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([BillingEntity]),
    StoreModule,
    ShopifyAuthModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingRepository],
  exports: [BillingService],
})
export class BillingModule {}
