import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { SaveRtoSignalsDto } from './dto/save-rto-signals.dto';
import { AcceptTermsDto } from './dto/accept-terms.dto';
import { OnboardingStatusResponseDto } from './dto/onboarding-status-response.dto';
import { ShopDomain, Audit } from '../../core/decorators';
import { ROUTES } from '../../app.routes';
import { constructSuccessResponse } from '../../shared/wrappers';

/**
 * Onboarding flow (§10). Authenticated routes (global ShopifySessionGuard).
 * Scan preview (step 3) and confirm (step 5) are served by the scan module.
 */
@ApiTags('onboarding')
@Controller(ROUTES.ONBOARDING)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding progress / next step' })
  @ApiOkResponse({ type: OnboardingStatusResponseDto })
  async getStatus(@ShopDomain() shopDomain: string) {
    const status = await this.onboardingService.getStatus(shopDomain);
    return constructSuccessResponse(status);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Step 1 — tag suggestions from recent orders' })
  async getTags(@ShopDomain() shopDomain: string) {
    const tags = await this.onboardingService.getAvailableTags(shopDomain);
    return constructSuccessResponse(tags);
  }

  @Post('signals')
  @Audit('RTO_SIGNALS_SAVED')
  @ApiOperation({ summary: 'Step 2 — save selected RTO signals and tags' })
  @ApiOkResponse({ type: OnboardingStatusResponseDto })
  async saveSignals(
    @ShopDomain() shopDomain: string,
    @Body() dto: SaveRtoSignalsDto,
  ) {
    const status = await this.onboardingService.saveSignals(shopDomain, dto);
    return constructSuccessResponse(status, 'UPDATED');
  }

  @Post('terms/accept')
  @Audit('TERMS_ACCEPTED')
  @ApiOperation({ summary: 'Step 4 — accept terms (both confirmations required)' })
  @ApiOkResponse({ type: OnboardingStatusResponseDto })
  async acceptTerms(
    @ShopDomain() shopDomain: string,
    @Body() dto: AcceptTermsDto,
  ) {
    const status = await this.onboardingService.acceptTerms(shopDomain, dto);
    return constructSuccessResponse(status, 'UPDATED');
  }
}
