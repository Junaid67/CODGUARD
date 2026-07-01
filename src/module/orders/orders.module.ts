import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderRecordEntity } from './entity/order-record.entity';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { RiskModule } from '../risk/risk.module';
import { StoreModule } from '../store/store.module';
import { ShopifyAuthModule } from '../shopify-auth/shopify-auth.module';

/**
 * Order records + dashboard. Exports OrdersService so the webhooks and scan
 * modules can persist/update order records and tag orders.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([OrderRecordEntity]),
    RiskModule,
    StoreModule,
    ShopifyAuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
