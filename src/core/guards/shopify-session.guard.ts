import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  shopifyApi,
  Shopify,
  LATEST_API_VERSION,
} from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { Request } from 'express';
import { METADATA_KEYS } from '../../app.constants';
import { UnAuthorizedException } from '../../shared/exceptions';

/**
 * Validates that API requests originate from an authenticated Shopify session.
 * Applied GLOBALLY (replaces the boilerplate JWT guard). Routes/controllers
 * marked with @Public() bypass it (health, OAuth, webhooks).
 *
 * Verifies the App Bridge session token (a JWT signed with the app's API
 * secret) sent as `Authorization: Bearer <token>`, and resolves the shop
 * domain from the token's `dest` claim. The resolved shop is attached to the
 * request for downstream guards/decorators (@ShopDomain).
 */
@Injectable()
export class ShopifySessionGuard implements CanActivate {
  private readonly logger = new Logger(ShopifySessionGuard.name);
  private readonly shopify: Shopify;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    const appUrl = this.configService.get<string>('app.url') ?? 'https://localhost';
    this.shopify = shopifyApi({
      apiKey: this.configService.get<string>('shopify.apiKey') ?? '',
      apiSecretKey: this.configService.get<string>('shopify.apiSecret') ?? '',
      scopes: this.configService.get<string[]>('shopify.scopes') ?? [],
      hostName: appUrl.replace(/^https?:\/\//, ''),
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      METADATA_KEYS.IS_PUBLIC,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    const sessionToken = authHeader?.replace('Bearer ', '').trim();
    const shopDomainHeader = request.headers['x-shopify-shop-domain'];
    const shopDomain = Array.isArray(shopDomainHeader)
      ? shopDomainHeader[0]
      : shopDomainHeader;

    if (!sessionToken) {
      throw new UnAuthorizedException('MISSING_SESSION');
    }

    try {
      const payload = await this.shopify.session.decodeSessionToken(
        sessionToken,
      );
      // `dest` is like https://acme.myshopify.com — extract the host.
      const resolvedShop = new URL(payload.dest).host;

      if (shopDomain && shopDomain !== resolvedShop) {
        throw new UnAuthorizedException('SHOP_MISMATCH');
      }

      request.shopDomain = resolvedShop;
      // `sub` is the Shopify user id — captured as the audit actor.
      request.shopifyUserId = payload.sub;
      return true;
    } catch (err) {
      if (err instanceof UnAuthorizedException) throw err;
      this.logger.warn(`Session validation failed: ${(err as Error).message}`);
      throw new UnAuthorizedException('INVALID_SESSION');
    }
  }
}
