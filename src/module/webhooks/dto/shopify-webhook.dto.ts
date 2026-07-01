/**
 * Shopify webhook payload shapes. These are INTERFACES (not class-validator
 * DTOs) on purpose: webhook bodies are arbitrary Shopify JSON and must NOT be
 * run through the global ValidationPipe whitelist (which would strip unknown
 * fields). Typing a @Body() param with an interface leaves the runtime
 * metatype as Object, so the ValidationPipe skips it.
 */

export interface ShopifyAddress {
  phone?: string | null;
  name?: string | null;
}

export interface ShopifyCustomer {
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface ShopifyOrderPayload {
  id: number | string;
  name?: string;
  order_number?: number | string;
  email?: string | null;
  phone?: string | null;
  customer?: ShopifyCustomer | null;
  shipping_address?: ShopifyAddress | null;
  billing_address?: ShopifyAddress | null;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  total_price?: string | null;
  currency?: string | null;
  tags?: string | null;
  created_at?: string | null;
}

export interface ShopifyRefundPayload {
  id: number | string;
  order_id: number | string;
}

export interface ShopifySubscriptionPayload {
  app_subscription?: {
    admin_graphql_api_id?: string;
    name?: string;
    status?: string;
  };
}
