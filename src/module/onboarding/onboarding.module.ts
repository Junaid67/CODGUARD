import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { StoreModule } from '../store/store.module';
import { ShopifyAuthModule } from '../shopify-auth/shopify-auth.module';

/**
 * Post-install onboarding (§10 steps 2 & 4 + status). Depends on StoreModule;
 * AuditService is global (terms acceptance is audited via @Audit()).
 */
@Module({
  imports: [StoreModule, ShopifyAuthModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
