import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Session } from '@shopify/shopify-api';
import { ShopifyService } from '../shopify-auth/shopify.service';
import { StoreService } from '../store/store.service';
import { OrdersService, OrderStateSnapshot } from '../orders/orders.service';
import { StoreEntity } from '../store/entity/store.entity';

/** Order node shape returned by the reconciliation GraphQL query. */
interface ReconcileOrderNode {
  id: string;
  name?: string;
  email?: string | null;
  createdAt?: string;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  tags?: string[];
  note?: string | null;
  totalPriceSet?: { shopMoney?: { amount?: string; currencyCode?: string } };
  customer?: { firstName?: string; lastName?: string; phone?: string | null } | null;
  shippingAddress?: { phone?: string | null; name?: string | null } | null;
  billingAddress?: { phone?: string | null } | null;
  fulfillments?: { displayStatus?: string | null }[] | null;
}

interface OrdersPage {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { node: ReconcileOrderNode }[];
  };
}

/**
 * Safety synchronization (§8). Webhooks are the primary source of truth; this
 * scheduled job catches anything they missed (downtime, dropped deliveries,
 * note/tag edits without a webhook) by re-reading every onboarded store's
 * recently-updated orders and running them through the same outcome detection
 * as orders/updated. Everything downstream is idempotent, so the lookback
 * window deliberately overlaps the cron interval.
 */
@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  /** Lookback window (hours) — 2× the cron interval so runs overlap. */
  private readonly LOOKBACK_HOURS = 12;
  private readonly PAGE_SIZE = 100;
  private readonly MAX_PAGES_PER_STORE = 5;

  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly storeService: StoreService,
    private readonly ordersService: OrdersService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async reconcileAllStores(): Promise<void> {
    const stores = await this.storeService.findAllOnboarded();
    this.logger.log(`Reconciliation started for ${stores.length} store(s)`);

    for (const store of stores) {
      try {
        const synced = await this.reconcileStore(store);
        this.logger.log(`Reconciled ${store.shopDomain}: ${synced} order(s)`);
      } catch (err) {
        // One failing store must not block the rest.
        this.logger.error(
          `Reconciliation failed for ${store.shopDomain}: ${(err as Error).message}`,
        );
      }
    }
  }

  /** Re-syncs one store's recently-updated orders. Returns the count synced. */
  async reconcileStore(store: StoreEntity): Promise<number> {
    const session = this.shopifyService.buildOfflineSession(
      store.shopDomain,
      this.storeService.getDecryptedAccessToken(store),
    );

    const since = new Date(
      Date.now() - this.LOOKBACK_HOURS * 3600000,
    ).toISOString();
    const query = `updated_at:>='${since}'`;

    let cursor: string | null = null;
    let synced = 0;

    for (let page = 0; page < this.MAX_PAGES_PER_STORE; page++) {
      const data: OrdersPage = await this.fetchPage(session, query, cursor);
      for (const { node } of data.orders.edges) {
        await this.ordersService.syncOrderState(
          store.shopDomain,
          this.toSnapshot(node),
        );
        synced += 1;
      }
      if (!data.orders.pageInfo.hasNextPage) break;
      cursor = data.orders.pageInfo.endCursor;
    }

    return synced;
  }

  private fetchPage(
    session: Session,
    query: string,
    cursor: string | null,
  ): Promise<OrdersPage> {
    return this.shopifyService.graphql<OrdersPage>(
      session,
      `query reconcileOrders($query: String!, $first: Int!, $cursor: String) {
        orders(first: $first, query: $query, after: $cursor, sortKey: UPDATED_AT) {
          pageInfo { hasNextPage endCursor }
          edges { node {
            id name email createdAt cancelledAt
            displayFinancialStatus displayFulfillmentStatus tags note
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { firstName lastName phone }
            shippingAddress { phone name }
            billingAddress { phone }
            fulfillments { displayStatus }
          } }
        }
      }`,
      { query, first: this.PAGE_SIZE, cursor },
    );
  }

  private toSnapshot(node: ReconcileOrderNode): OrderStateSnapshot {
    return {
      shopifyOrderId: this.gidToId(node.id),
      orderNumber: node.name ?? null,
      customerName: this.extractName(node),
      phoneRaw:
        node.customer?.phone ||
        node.shippingAddress?.phone ||
        node.billingAddress?.phone ||
        null,
      email: node.email ?? null,
      tags: node.tags ?? [],
      note: node.note ?? null,
      financialStatus: node.displayFinancialStatus ?? null,
      fulfillmentStatus: node.displayFulfillmentStatus ?? null,
      cancelledAt: node.cancelledAt ?? null,
      shipmentDelivered: (node.fulfillments ?? []).some(
        (f) => (f.displayStatus ?? '').toUpperCase() === 'DELIVERED',
      ),
      orderTotal: node.totalPriceSet?.shopMoney?.amount
        ? Number(node.totalPriceSet.shopMoney.amount)
        : null,
      currency: node.totalPriceSet?.shopMoney?.currencyCode ?? null,
      shopifyCreatedAt: node.createdAt ? new Date(node.createdAt) : null,
    };
  }

  private extractName(node: ReconcileOrderNode): string | null {
    if (node.customer?.firstName || node.customer?.lastName) {
      return `${node.customer.firstName ?? ''} ${node.customer.lastName ?? ''}`.trim();
    }
    return node.shippingAddress?.name ?? null;
  }

  private gidToId(gid: string): string {
    return gid.split('/').pop() ?? gid;
  }
}
