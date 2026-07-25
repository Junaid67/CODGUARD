import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { WebhookHmacGuard } from '../../core/guards';
import { Public } from '../../core/decorators';
import { ROUTES } from '../../app.routes';
import { OrderCreatedHandler } from './handlers/order-created.handler';
import { OrderUpdatedHandler } from './handlers/order-updated.handler';
import { OrderCancelledHandler } from './handlers/order-cancelled.handler';
import { RefundCreatedHandler } from './handlers/refund-created.handler';
import { AppUninstalledHandler } from './handlers/app-uninstalled.handler';
import { SubscriptionUpdatedHandler } from './handlers/subscription-updated.handler';
import {
  ShopifyOrderPayload,
  ShopifyRefundPayload,
  ShopifySubscriptionPayload,
} from './dto/shopify-webhook.dto';

/**
 * All Shopify webhook routes (§11). Every route:
 *  - is @Public() (no Shopify session token on webhooks)
 *  - is protected by WebhookHmacGuard (HMAC verified against the raw body)
 *  - resolves the shop from the x-shopify-shop-domain header
 *
 * Payloads are typed with interfaces so the global ValidationPipe does not
 * strip unknown Shopify fields. Returns 200 quickly; handler errors surface as
 * 5xx so Shopify retries.
 */
@ApiExcludeController()
@Public()
@UseGuards(WebhookHmacGuard)
@Controller(ROUTES.WEBHOOKS)
export class WebhooksController {
  constructor(
    private readonly orderCreated: OrderCreatedHandler,
    private readonly orderUpdated: OrderUpdatedHandler,
    private readonly orderCancelled: OrderCancelledHandler,
    private readonly refundCreated: RefundCreatedHandler,
    private readonly appUninstalled: AppUninstalledHandler,
    private readonly subscriptionUpdated: SubscriptionUpdatedHandler,
  ) {}

  @Post('orders/create')
  @HttpCode(HttpStatus.OK)
  async ordersCreate(
    @Headers('x-shopify-shop-domain') shop: string,
    @Body() order: ShopifyOrderPayload,
  ): Promise<{ received: boolean }> {
    await this.orderCreated.handle(shop, order);
    return { received: true };
  }

  @Post('orders/updated')
  @HttpCode(HttpStatus.OK)
  async ordersUpdated(
    @Headers('x-shopify-shop-domain') shop: string,
    @Body() order: ShopifyOrderPayload,
  ): Promise<{ received: boolean }> {
    await this.orderUpdated.handle(shop, order);
    return { received: true };
  }

  @Post('orders/cancelled')
  @HttpCode(HttpStatus.OK)
  async ordersCancelled(
    @Headers('x-shopify-shop-domain') shop: string,
    @Body() order: ShopifyOrderPayload,
  ): Promise<{ received: boolean }> {
    await this.orderCancelled.handle(shop, order);
    return { received: true };
  }

  @Post('refunds/create')
  @HttpCode(HttpStatus.OK)
  async refundsCreate(
    @Headers('x-shopify-shop-domain') shop: string,
    @Body() refund: ShopifyRefundPayload,
  ): Promise<{ received: boolean }> {
    await this.refundCreated.handle(shop, refund);
    return { received: true };
  }

  @Post('app/uninstalled')
  @HttpCode(HttpStatus.OK)
  async appUninstall(
    @Headers('x-shopify-shop-domain') shop: string,
  ): Promise<{ received: boolean }> {
    await this.appUninstalled.handle(shop);
    return { received: true };
  }

  @Post('billing/subscription')
  @HttpCode(HttpStatus.OK)
  async subscription(
    @Headers('x-shopify-shop-domain') shop: string,
    @Body() payload: ShopifySubscriptionPayload,
  ): Promise<{ received: boolean }> {
    await this.subscriptionUpdated.handle(shop, payload);
    return { received: true };
  }
}
