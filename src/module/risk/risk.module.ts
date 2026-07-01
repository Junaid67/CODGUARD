import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneProfileEntity } from './entity/phone-profile.entity';
import { PhoneProfileRepository } from './risk.repository';
import { RiskService } from './risk.service';
import { ContributionsModule } from '../contributions/contributions.module';

/**
 * Core risk scoring engine. Internal service (no controller) consumed by
 * webhooks, scan and orders. Depends on ContributionsModule for cross-store
 * isolation and new-store detection.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PhoneProfileEntity]),
    ContributionsModule,
  ],
  providers: [RiskService, PhoneProfileRepository],
  exports: [RiskService],
})
export class RiskModule {}
