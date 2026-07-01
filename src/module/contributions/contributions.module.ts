import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreRtoContributionEntity } from './entity/store-rto-contribution.entity';
import { ContributionsRepository } from './contributions.repository';
import { ContributionsService } from './contributions.service';

/**
 * Cross-store contribution tracking (data isolation). No controller — this is
 * an internal service consumed by RiskService. Exports the service for reuse.
 */
@Module({
  imports: [TypeOrmModule.forFeature([StoreRtoContributionEntity])],
  providers: [ContributionsService, ContributionsRepository],
  exports: [ContributionsService],
})
export class ContributionsModule {}
