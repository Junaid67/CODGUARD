import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreEntity } from './entity/store.entity';
import { StoreRepository } from './store.repository';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { PlanLimitGuard } from '../../core/guards/plan-limit.guard';

/**
 * Store settings & configuration. Exports StoreService + StoreRepository so
 * dependent modules (shopify-auth, onboarding, billing, webhooks) can reuse
 * them, plus PlanLimitGuard (which depends on StoreService) for modules that
 * enforce monthly limits via @UseGuards(PlanLimitGuard).
 */
@Module({
  imports: [TypeOrmModule.forFeature([StoreEntity])],
  controllers: [StoreController],
  providers: [StoreService, StoreRepository, PlanLimitGuard],
  exports: [StoreService, StoreRepository, PlanLimitGuard],
})
export class StoreModule {}
