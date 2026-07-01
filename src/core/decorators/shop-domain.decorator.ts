import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Injects the authenticated shop domain (e.g. `acme.myshopify.com`) resolved
 * by the ShopifySessionGuard into a controller method parameter.
 *
 *   @Get() getSettings(@ShopDomain() shopDomain: string) { ... }
 */
export const ShopDomain = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.shopDomain;
  },
);
