import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ShopifyAuthService } from './shopify-auth.service';
import { Public } from '../../core/decorators';
import { ROUTES } from '../../app.routes';

/**
 * Shopify OAuth install + callback. Public routes (no Shopify session exists
 * yet during install). Excluded from Swagger — these are browser-redirect
 * endpoints driven by Shopify, not JSON APIs.
 */
@ApiExcludeController()
@Controller(ROUTES.SHOPIFY_AUTH)
export class ShopifyAuthController {
  constructor(private readonly shopifyAuthService: ShopifyAuthService) {}

  @Public()
  @Get()
  async install(
    @Query('shop') shop: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.shopifyAuthService.begin(shop, req, res);
  }

  @Public()
  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.shopifyAuthService.callback(req, res);
  }
}
