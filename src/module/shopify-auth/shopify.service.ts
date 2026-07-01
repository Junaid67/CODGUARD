import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  shopifyApi,
  Shopify,
  Session,
  LATEST_API_VERSION,
} from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

/**
 * Shared Shopify Admin API integration client. Owns the configured `shopify`
 * instance and the common operations used across modules: building offline
 * sessions from a store's (decrypted) token, GraphQL calls, webhook
 * registration and order tagging.
 *
 * Exported by ShopifyAuthModule and reused by billing/webhooks/orders/scan so
 * there is a single Shopify integration point.
 */
@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);
  private readonly shopify: Shopify;
  private readonly appUrl: string;

  /** Webhook topics registered on install, with their handler paths. */
  static readonly WEBHOOK_TOPICS: { topic: string; path: string }[] = [
    { topic: 'ORDERS_CREATE', path: 'orders/create' },
    { topic: 'ORDERS_CANCELLED', path: 'orders/cancelled' },
    { topic: 'REFUNDS_CREATE', path: 'refunds/create' },
    { topic: 'APP_UNINSTALLED', path: 'app/uninstalled' },
    { topic: 'APP_SUBSCRIPTIONS_UPDATE', path: 'billing/subscription' },
  ];

  constructor(private readonly configService: ConfigService) {
    this.appUrl = this.configService.get<string>('app.url') ?? 'https://localhost';
    this.shopify = shopifyApi({
      apiKey: this.configService.get<string>('shopify.apiKey') ?? '',
      apiSecretKey: this.configService.get<string>('shopify.apiSecret') ?? '',
      scopes: this.configService.get<string[]>('shopify.scopes') ?? [],
      hostName: this.appUrl.replace(/^https?:\/\//, ''),
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: true,
    });
  }

  /** The underlying configured Shopify instance. */
  getInstance(): Shopify {
    return this.shopify;
  }

  /** API key (public) — used to build the embedded app redirect URL. */
  getApiKey(): string {
    return this.configService.get<string>('shopify.apiKey') ?? '';
  }

  /** Builds an offline session for server-to-server Admin API calls. */
  buildOfflineSession(shop: string, accessToken: string): Session {
    return new Session({
      id: `offline_${shop}`,
      shop,
      state: '',
      isOnline: false,
      accessToken,
      scope: (this.configService.get<string[]>('shopify.scopes') ?? []).join(','),
    });
  }

  /** Executes an Admin GraphQL query/mutation. */
  async graphql<T = unknown>(
    session: Session,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const client = new this.shopify.clients.Graphql({ session });
    const response = await client.request(query, { variables });
    return response.data as T;
  }

  /**
   * Registers all app webhooks as HTTPS subscriptions pointing at our
   * controller. Idempotent on Shopify's side (re-registering the same
   * topic+endpoint is a no-op / returns an already-taken error we tolerate).
   */
  async registerWebhooks(session: Session): Promise<void> {
    for (const { topic, path } of ShopifyService.WEBHOOK_TOPICS) {
      const callbackUrl = `${this.appUrl}/api/v1/webhooks/${path}`;
      try {
        await this.graphql(
          session,
          `mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $url: URL!) {
            webhookSubscriptionCreate(
              topic: $topic
              webhookSubscription: { callbackUrl: $url, format: JSON }
            ) {
              webhookSubscription { id }
              userErrors { field message }
            }
          }`,
          { topic, url: callbackUrl },
        );
      } catch (err) {
        this.logger.warn(
          `Webhook registration for ${topic} failed: ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Distinct tags seen on the store's most recent orders — used to populate
   * the onboarding tag picker. Best-effort: Shopify has no "all tags" query,
   * so this samples the latest orders rather than scanning the full history.
   */
  async fetchRecentOrderTags(session: Session): Promise<string[]> {
    const data = await this.graphql<{
      orders: { edges: { node: { tags: string[] } }[] };
    }>(
      session,
      `query {
        orders(first: 250, sortKey: UPDATED_AT, reverse: true) {
          edges { node { tags } }
        }
      }`,
    );

    const tags = new Set<string>();
    for (const edge of data.orders.edges) {
      for (const tag of edge.node.tags ?? []) tags.add(tag);
    }
    return Array.from(tags).sort();
  }

  /** Embedded-app URL to redirect the merchant to after install. */
  buildAppRedirectUrl(shop: string): string {
    return `https://${shop}/admin/apps/${this.getApiKey()}`;
  }

  /**
   * Sets the COD risk tag on an order, removing any other cod-risk:* tags so a
   * single, current risk tag remains. `riskLevel` is the enum value
   * (low/medium/high/unknown).
   */
  async setRiskTag(
    session: Session,
    shopifyOrderId: string,
    riskLevel: string,
  ): Promise<void> {
    const orderGid = `gid://shopify/Order/${shopifyOrderId}`;
    const desired = `cod-risk:${riskLevel}`;
    const allRiskTags = [
      'cod-risk:low',
      'cod-risk:medium',
      'cod-risk:high',
      'cod-risk:unknown',
    ];
    const toRemove = allRiskTags.filter((t) => t !== desired);

    await this.graphql(
      session,
      `mutation tagsRemove($id: ID!, $tags: [String!]!) {
        tagsRemove(id: $id, tags: $tags) { userErrors { message } }
      }`,
      { id: orderGid, tags: toRemove },
    );
    await this.graphql(
      session,
      `mutation tagsAdd($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) { userErrors { message } }
      }`,
      { id: orderGid, tags: [desired] },
    );
  }
}
