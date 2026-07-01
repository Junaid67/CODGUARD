import { Injectable, Logger } from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { StoreEntity } from './entity/store.entity';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { EncryptionService } from '../../core/services';
import { NotFoundException } from '../../shared/exceptions';
import { MapperUtil } from '../../shared/utils';
import { PLAN_FEATURES, PLAN_LIMITS } from '../../shared/constants';
import { PlanEnum } from '../../shared/enums';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  /** Returns the store or null. */
  findByDomain(shopDomain: string): Promise<StoreEntity | null> {
    return this.storeRepository.findByDomain(shopDomain);
  }

  /** Returns the store or throws 404. */
  async findByDomainOrThrow(shopDomain: string): Promise<StoreEntity> {
    const store = await this.storeRepository.findByDomain(shopDomain);
    if (!store) {
      throw new NotFoundException(`Store not found: ${shopDomain}`);
    }
    return store;
  }

  /**
   * Creates a store on install, or refreshes the (encrypted) access token on
   * re-install/re-auth. The token is AES-256 encrypted at rest.
   */
  async createOrUpdate(
    shopDomain: string,
    accessToken: string,
  ): Promise<StoreEntity> {
    const encryptedToken = this.encryptionService.encrypt(accessToken);
    let store = await this.storeRepository.findByDomain(shopDomain);

    if (store) {
      store.accessToken = encryptedToken;
      // Re-install resurrects a soft-deleted store.
      store.deletedAt = null as unknown as Date;
    } else {
      store = this.storeRepository.create({
        shopDomain,
        accessToken: encryptedToken,
      });
    }

    return this.storeRepository.save(store);
  }

  /** Decrypts and returns the store's Shopify access token. Never logged. */
  getDecryptedAccessToken(store: StoreEntity): string {
    return this.encryptionService.decrypt(store.accessToken);
  }

  /** Settings view for the embedded app (token excluded, limits/features derived). */
  async getSettings(shopDomain: string): Promise<StoreResponseDto> {
    const store = await this.findByDomainOrThrow(shopDomain);
    return this.toResponseDto(store);
  }

  /** Updates RTO signal/tag configuration. */
  async updateSettings(
    shopDomain: string,
    dto: UpdateStoreSettingsDto,
  ): Promise<StoreResponseDto> {
    const store = await this.findByDomainOrThrow(shopDomain);

    if (dto.rtoSignals !== undefined) store.rtoSignals = dto.rtoSignals;
    if (dto.rtoTags !== undefined) store.rtoTags = dto.rtoTags;

    const saved = await this.storeRepository.save(store);
    this.logger.log(`Settings updated for ${shopDomain}`);
    return this.toResponseDto(saved);
  }

  /** Resets the monthly order counter (called at the start of a new month). */
  async resetMonthlyCount(shopDomain: string): Promise<void> {
    await this.storeRepository.update(
      { shopDomain },
      { monthlyOrderCount: 0, monthlyCountResetAt: new Date() },
    );
  }

  /** Atomically increments the monthly order counter (webhook order/create). */
  async incrementMonthlyOrderCount(shopDomain: string): Promise<void> {
    await this.storeRepository.increment({ shopDomain }, 'monthlyOrderCount', 1);
  }

  /** Marks onboarding complete. */
  async markOnboardingComplete(shopDomain: string): Promise<void> {
    await this.storeRepository.update({ shopDomain }, { onboardingComplete: true });
  }

  /** Records terms acceptance with a timestamp. */
  async acceptTerms(shopDomain: string): Promise<void> {
    await this.storeRepository.update(
      { shopDomain },
      { termsAccepted: true, termsAcceptedAt: new Date() },
    );
  }

  /** Records a completed scan: bumps total scanned and sets last-scan time. */
  async recordScan(shopDomain: string, scannedCount: number): Promise<void> {
    await this.storeRepository.increment(
      { shopDomain },
      'totalOrdersScanned',
      scannedCount,
    );
    await this.storeRepository.update(
      { shopDomain },
      { lastScanAt: new Date() },
    );
  }

  /** Soft-deletes the store (on app uninstall). Contributions are kept. */
  async softDeleteByDomain(shopDomain: string): Promise<void> {
    await this.storeRepository.softDelete({ shopDomain });
  }

  /** Updates the store's plan (and optional Shopify billing id). */
  async updatePlan(
    shopDomain: string,
    plan: PlanEnum,
    billingId?: string,
  ): Promise<void> {
    await this.storeRepository.update(
      { shopDomain },
      billingId ? { plan, billingId } : { plan },
    );
  }

  /** Maps an entity to the response DTO, attaching derived plan limit/features. */
  toResponseDto(store: StoreEntity): StoreResponseDto {
    const dto = MapperUtil.map(StoreResponseDto, store);
    const limit = PLAN_LIMITS[store.plan].monthlyOrders;
    dto.monthlyOrderLimit = Number.isFinite(limit) ? limit : null;
    dto.features = PLAN_FEATURES[store.plan];
    return dto;
  }
}
