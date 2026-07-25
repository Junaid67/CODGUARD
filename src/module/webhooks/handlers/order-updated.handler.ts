import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { ShopifyOrderPayload } from '../dto/shopify-webhook.dto';

/**
 * orders/updated (§6): the channel that carries tag, note, fulfillment and
 * cancellation changes after an order is created. Maps the REST payload to a
 * normalized snapshot and lets OrdersService.syncOrderState refresh the local
 * record and detect the delivery outcome (RTO via the store's signals,
 * DELIVERED via the COD paid/shipment heuristic).
 */
@Injectable()
export class OrderUpdatedHandler {
  private readonly logger = new Logger(OrderUpdatedHandler.name);

  constructor(private readonly ordersService: OrdersService) {}

  async handle(shopDomain: string, order: ShopifyOrderPayload): Promise<void> {
    const shipmentDelivered = (order.fulfillments ?? []).some(
      (f) => (f.shipment_status ?? '').toLowerCase() === 'delivered',
    );

    await this.ordersService.syncOrderState(shopDomain, {
      shopifyOrderId: String(order.id),
      orderNumber: order.name ?? String(order.order_number ?? order.id),
      customerName: this.extractCustomerName(order),
      phoneRaw: this.extractPhone(order),
      email: order.email ?? null,
      tags: this.parseTags(order.tags),
      note: order.note ?? null,
      financialStatus: order.financial_status ?? null,
      fulfillmentStatus: order.fulfillment_status ?? null,
      cancelledAt: order.cancelled_at ?? null,
      shipmentDelivered,
      orderTotal: order.total_price ? Number(order.total_price) : null,
      currency: order.currency ?? null,
      shopifyCreatedAt: order.created_at ? new Date(order.created_at) : null,
    });
  }

  private extractPhone(order: ShopifyOrderPayload): string | null {
    return (
      order.phone ||
      order.customer?.phone ||
      order.shipping_address?.phone ||
      order.billing_address?.phone ||
      null
    );
  }

  private extractCustomerName(order: ShopifyOrderPayload): string | null {
    if (order.customer?.first_name || order.customer?.last_name) {
      return `${order.customer.first_name ?? ''} ${order.customer.last_name ?? ''}`.trim();
    }
    return order.shipping_address?.name ?? null;
  }

  private parseTags(tags?: string | null): string[] {
    if (!tags) return [];
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
}
