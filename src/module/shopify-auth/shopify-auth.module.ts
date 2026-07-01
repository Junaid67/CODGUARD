import { Module } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { ShopifyAuthService } from './shopify-auth.service';
import { ShopifyAuthController } from './shopify-auth.controller';
import { StoreModule } from '../store/store.module';

/**
 * Shopify OAuth install/callback. Exports ShopifyService (the shared Admin API
 * client) so billing, webhooks, orders and scan can reuse one integration
 * point without re-instantiating the Shopify SDK.
 */
@Module({
  imports: [StoreModule],
  controllers: [ShopifyAuthController],
  providers: [ShopifyService, ShopifyAuthService],
  exports: [ShopifyService],
})
export class ShopifyAuthModule {}
