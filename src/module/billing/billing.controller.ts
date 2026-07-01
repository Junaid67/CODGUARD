import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { BillingResponseDto } from './dto/billing-response.dto';
import { ShopDomain, Audit, Public } from '../../core/decorators';
import { ROUTES } from '../../app.routes';
import { constructSuccessResponse } from '../../shared/wrappers';

@ApiTags('billing')
@Controller(ROUTES.BILLING)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get current plan / billing status' })
  @ApiOkResponse({ type: BillingResponseDto })
  async getCurrent(@ShopDomain() shopDomain: string) {
    const billing = await this.billingService.getCurrentBilling(shopDomain);
    return constructSuccessResponse(billing);
  }

  @Post('subscribe')
  @Audit('SUBSCRIPTION_CREATED')
  @ApiOperation({ summary: 'Create/switch subscription — returns confirmationUrl for paid plans' })
  @ApiOkResponse({ type: BillingResponseDto })
  async subscribe(
    @ShopDomain() shopDomain: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    const billing = await this.billingService.createSubscription(shopDomain, dto.plan);
    return constructSuccessResponse(billing);
  }

  /**
   * Shopify billing return URL (top-level redirect — no session token), hence
   * @Public(). The shop is passed through the returnUrl query and verified
   * against Shopify's active subscriptions before the plan is applied.
   */
  @Public()
  @Get('callback')
  @ApiExcludeEndpoint()
  async callback(
    @Query('shop') shop: string,
    @Res() res: Response,
  ): Promise<void> {
    const redirectUrl = await this.billingService.activateFromCallback(shop);
    res.redirect(redirectUrl);
  }
}
