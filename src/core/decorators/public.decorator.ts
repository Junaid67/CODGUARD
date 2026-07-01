import { SetMetadata } from '@nestjs/common';
import { METADATA_KEYS } from '../../app.constants';

/**
 * Marks a route (or controller) as public — bypasses the globally-applied
 * ShopifySessionGuard. Use for health checks, OAuth install/callback, and
 * webhook endpoints (which are instead protected by WebhookHmacGuard).
 */
export const Public = () => SetMetadata(METADATA_KEYS.IS_PUBLIC, true);
