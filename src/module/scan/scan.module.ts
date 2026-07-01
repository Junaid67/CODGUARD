import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { ShopifyAuthModule } from '../shopify-auth/shopify-auth.module';
import { StoreModule } from '../store/store.module';
import { RiskModule } from '../risk/risk.module';
import { OrdersModule } from '../orders/orders.module';

/**
 * Historical scanning via the Shopify Bulk Operations API (§10 steps 3 & 5).
 * HttpModule is used to download the bulk-operation JSONL result file.
 */
@Module({
  imports: [
    HttpModule,
    ShopifyAuthModule,
    StoreModule,
    RiskModule,
    OrdersModule,
  ],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}
