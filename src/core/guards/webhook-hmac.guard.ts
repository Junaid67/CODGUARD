import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

/**
 * Verifies the `X-Shopify-Hmac-SHA256` signature on webhook requests using the
 * preserved raw body. Applied to ALL webhook routes — no exceptions. Returns
 * false (reject silently) on any mismatch rather than throwing details.
 *
 * Requires raw body preservation (rawBody: true in main.ts / RawBodyMiddleware).
 */
@Injectable()
export class WebhookHmacGuard implements CanActivate {
  private readonly logger = new Logger(WebhookHmacGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const hmacHeader = request.headers['x-shopify-hmac-sha256'];
    const hmac = Array.isArray(hmacHeader) ? hmacHeader[0] : hmacHeader;
    const rawBody = request.rawBody;

    if (!hmac || !rawBody) {
      this.logger.warn('Webhook rejected: missing HMAC header or raw body');
      return false;
    }

    const secret = this.configService.get<string>('shopify.apiSecret');
    if (!secret) {
      this.logger.error('Webhook rejected: SHOPIFY_API_SECRET not configured');
      return false;
    }

    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    try {
      const valid = crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(computed),
      );
      if (!valid) {
        this.logger.warn('Webhook rejected: HMAC mismatch');
      }
      return valid;
    } catch {
      // Buffer length mismatch → invalid.
      return false;
    }
  }
}
