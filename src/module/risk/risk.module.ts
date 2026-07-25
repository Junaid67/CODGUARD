import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneProfileEntity } from './entity/phone-profile.entity';
import { PhoneProfileRepository } from './risk.repository';
import { RiskService } from './risk.service';
import { RiskController } from './risk.controller';
import { ContributionsModule } from '../contributions/contributions.module';

/**
 * Core risk scoring engine, consumed by webhooks, scan and orders, plus the
 * customer-intelligence lookup endpoint. Depends on ContributionsModule for
 * cross-store isolation and new-store detection.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PhoneProfileEntity]),
    ContributionsModule,
  ],
  controllers: [RiskController],
  providers: [RiskService, PhoneProfileRepository],
  exports: [RiskService],
})
export class RiskModule {}
