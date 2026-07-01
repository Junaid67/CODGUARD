import { Injectable, Logger } from '@nestjs/common';
import { PhoneProfileRepository } from './risk.repository';
import { RiskScoreResponseDto } from './dto/risk-score-response.dto';
import { EncryptionService } from '../../core/services';
import { ContributionsService } from '../contributions/contributions.service';
import { OrderOutcomeEnum, RiskLevelEnum } from '../../shared/enums';
import { normalizePhone, AppUtil } from '../../shared/utils';

/**
 * Core risk scoring engine (§9). Scores phones from AGGREGATED cross-store data
 * (never single-store), and records confirmed outcomes into the shared phone
 * profile. Raw phone numbers are normalized → hashed (lookups) / encrypted
 * (display) and never stored or logged in plaintext.
 */
@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(
    private readonly phoneProfileRepository: PhoneProfileRepository,
    private readonly encryptionService: EncryptionService,
    private readonly contributionsService: ContributionsService,
  ) {}

  /**
   * Scores a phone number. Returns UNKNOWN for invalid/normalize-failing input
   * or a number with no data yet.
   */
  async scorePhone(phone: string): Promise<RiskScoreResponseDto> {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return {
        riskLevel: RiskLevelEnum.UNKNOWN,
        deliveryRate: null,
        totalOrders: 0,
        message: 'Invalid phone number',
      };
    }

    const phoneHash = this.encryptionService.hash(normalized);
    const profile = await this.phoneProfileRepository.findByHash(phoneHash);

    if (!profile || profile.totalOrders === 0) {
      return {
        riskLevel: RiskLevelEnum.UNKNOWN,
        deliveryRate: null,
        totalOrders: 0,
        message: 'No data yet',
      };
    }

    return {
      riskLevel: profile.riskLevel,
      deliveryRate: Number(profile.deliveryRate),
      totalOrders: profile.totalOrders,
      deliveredCount: profile.deliveredCount,
      rtoCount: profile.rtoCount,
      contributingStores: profile.contributingStoreCount,
    };
  }

  /**
   * Records a confirmed outcome (DELIVERED/RTO) into the shared phone profile.
   * Idempotent per (shop, order): a replayed/duplicate webhook for the same
   * order is ignored so counts are never inflated. PENDING outcomes are not
   * recorded.
   */
  async recordOutcome(
    phone: string,
    outcome: OrderOutcomeEnum,
    shopDomain: string,
    shopifyOrderId: string,
  ): Promise<void> {
    if (outcome === OrderOutcomeEnum.PENDING) return;

    const normalized = normalizePhone(phone);
    if (!normalized) {
      this.logger.warn(
        `Skipping outcome for order ${shopifyOrderId}: phone failed normalization`,
      );
      return;
    }

    const phoneHash = this.encryptionService.hash(normalized);

    // Idempotency: skip if this store already contributed this exact order.
    if (await this.contributionsService.existsForOrder(shopDomain, shopifyOrderId)) {
      this.logger.debug(
        `Outcome already recorded for order ${shopifyOrderId} — skipping`,
      );
      return;
    }

    // Is this the first time THIS store contributes data for THIS phone?
    const isNewStore = !(await this.contributionsService.existsForStore(
      shopDomain,
      phoneHash,
    ));

    // Persist the contribution first (DB unique constraint dedupes races).
    const contribution = await this.contributionsService.record({
      shopDomain,
      phoneHash,
      outcome,
      shopifyOrderId,
    });
    if (!contribution) return; // lost a race to a concurrent duplicate

    // Upsert + update the aggregate profile.
    let profile = await this.phoneProfileRepository.findByHash(phoneHash);
    if (!profile) {
      profile = this.phoneProfileRepository.create({
        phoneHash,
        phoneEncrypted: this.encryptionService.encrypt(normalized),
      });
    }

    profile.totalOrders += 1;
    if (outcome === OrderOutcomeEnum.DELIVERED) profile.deliveredCount += 1;
    if (outcome === OrderOutcomeEnum.RTO) profile.rtoCount += 1;
    if (isNewStore) profile.contributingStoreCount += 1;

    profile.deliveryRate = AppUtil.round2(
      (profile.deliveredCount / profile.totalOrders) * 100,
    );
    profile.riskLevel = AppUtil.riskLevelFromDeliveryRate(profile.deliveryRate);

    await this.phoneProfileRepository.save(profile);
  }
}
