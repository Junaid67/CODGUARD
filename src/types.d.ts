import { Session } from '@shopify/shopify-api';

/**
 * Augment the Express Request with fields populated by our middleware/guards:
 *  - rawBody: preserved raw request body for HMAC webhook verification
 *  - requestId: correlation id assigned by request-id.middleware
 *  - shopDomain: shop resolved by ShopifySessionGuard
 *  - session: validated Shopify session
 */
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      requestId?: string;
      shopDomain?: string;
      shopifyUserId?: string;
      session?: Session;
    }
  }
}

export {};
