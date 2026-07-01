import { Injectable, Logger } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { ShopifyService } from '../shopify-auth/shopify.service';
import { SaveRtoSignalsDto } from './dto/save-rto-signals.dto';
import { AcceptTermsDto } from './dto/accept-terms.dto';
import {
  OnboardingStatusResponseDto,
  OnboardingStep,
} from './dto/onboarding-status-response.dto';
import { BusinessRuleFailureException } from '../../shared/exceptions';
import { PLAN_FEATURES, RTO_SIGNAL_DEFINITIONS } from '../../shared/constants';
import { RtoSignalEnum } from '../../shared/enums';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly storeService: StoreService,
    private readonly shopifyService: ShopifyService,
  ) {}

  /** Tag suggestions (from recent orders) for the TAG signal picker. */
  async getAvailableTags(shopDomain: string): Promise<string[]> {
    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    const session = this.shopifyService.buildOfflineSession(
      store.shopDomain,
      this.storeService.getDecryptedAccessToken(store),
    );
    return this.shopifyService.fetchRecentOrderTags(session);
  }

  /** Step 2: persist selected RTO signals + tags. */
  async saveSignals(
    shopDomain: string,
    dto: SaveRtoSignalsDto,
  ): Promise<OnboardingStatusResponseDto> {
    const store = await this.storeService.findByDomainOrThrow(shopDomain);

    // Courier signals require courier integration (PRO plan only).
    if (!PLAN_FEATURES[store.plan].courierIntegration) {
      const courierSignals = new Set(
        RTO_SIGNAL_DEFINITIONS.filter((s) => s.isCourier).map((s) => s.signal),
      );
      const selectedCourier = dto.signals.filter((s) => courierSignals.has(s));
      if (selectedCourier.length > 0) {
        throw new BusinessRuleFailureException(
          `Courier signals (${selectedCourier.join(', ')}) require the PRO plan`,
          'COURIER_SIGNAL_NOT_ALLOWED',
        );
      }
    }

    // TAG signal implies the merchant should provide at least one tag.
    if (dto.signals.includes(RtoSignalEnum.TAG) && (!dto.tags || dto.tags.length === 0)) {
      throw new BusinessRuleFailureException(
        'Select at least one tag when the TAG signal is enabled',
        'TAGS_REQUIRED',
      );
    }

    await this.storeService.updateSettings(shopDomain, {
      rtoSignals: dto.signals,
      rtoTags: dto.tags ?? [],
    });

    this.logger.log(`Signals saved for ${shopDomain}`);
    return this.getStatus(shopDomain);
  }

  /** Step 4: accept terms — both checkboxes required. Records timestamp. */
  async acceptTerms(
    shopDomain: string,
    dto: AcceptTermsDto,
  ): Promise<OnboardingStatusResponseDto> {
    if (!dto.confirmed || !dto.signalsAccurate) {
      throw new BusinessRuleFailureException(
        'Both confirmations are required to accept the terms',
        'TERMS_NOT_FULLY_ACCEPTED',
      );
    }

    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    if (!store.rtoSignals || store.rtoSignals.length === 0) {
      throw new BusinessRuleFailureException(
        'Select your RTO signals before accepting the terms',
        'SIGNALS_REQUIRED_FIRST',
      );
    }

    await this.storeService.acceptTerms(shopDomain);

    this.logger.log(`Terms accepted for ${shopDomain}`);
    return this.getStatus(shopDomain);
  }

  /** Onboarding progress used by the embedded app to route to the next step. */
  async getStatus(shopDomain: string): Promise<OnboardingStatusResponseDto> {
    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    const hasSignals = !!store.rtoSignals && store.rtoSignals.length > 0;

    let nextStep: OnboardingStep;
    if (store.onboardingComplete) nextStep = OnboardingStep.COMPLETE;
    else if (!hasSignals) nextStep = OnboardingStep.SIGNALS;
    else if (!store.termsAccepted) nextStep = OnboardingStep.TERMS;
    else nextStep = OnboardingStep.CONFIRM_SCAN;

    return {
      onboardingComplete: store.onboardingComplete,
      hasSignals,
      signalsCount: store.rtoSignals?.length ?? 0,
      tagsCount: store.rtoTags?.length ?? 0,
      termsAccepted: store.termsAccepted,
      termsAcceptedAt: store.termsAcceptedAt ?? null,
      lastScanAt: store.lastScanAt ?? null,
      totalOrdersScanned: store.totalOrdersScanned,
      nextStep,
    };
  }
}
