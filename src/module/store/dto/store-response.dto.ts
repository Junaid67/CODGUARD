import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PlanEnum, RtoSignalEnum } from '../../../shared/enums';
import { PlanFeatures } from '../../../shared/constants';

/**
 * Store settings surfaced to the embedded app. Never exposes the access token.
 * @Expose() marks the only fields MapperUtil will copy from the entity;
 * monthlyOrderLimit and features are derived and set by the service.
 */
export class StoreResponseDto {
  @ApiProperty()
  @Expose()
  shopDomain: string;

  @ApiProperty({ enum: PlanEnum })
  @Expose()
  plan: PlanEnum;

  @ApiProperty({ enum: RtoSignalEnum, isArray: true, nullable: true })
  @Expose()
  rtoSignals: RtoSignalEnum[];

  @ApiProperty({ type: [String], nullable: true })
  @Expose()
  rtoTags: string[];

  @ApiProperty()
  @Expose()
  onboardingComplete: boolean;

  @ApiProperty()
  @Expose()
  termsAccepted: boolean;

  @ApiProperty({ nullable: true })
  @Expose()
  termsAcceptedAt: Date;

  @ApiProperty()
  @Expose()
  monthlyOrderCount: number;

  @ApiProperty({ nullable: true })
  @Expose()
  lastScanAt: Date;

  @ApiProperty()
  @Expose()
  totalOrdersScanned: number;

  // Derived (set by service) — null means unlimited.
  @ApiProperty({ nullable: true, description: 'null = unlimited (PRO)' })
  @Expose()
  monthlyOrderLimit: number | null;

  @ApiProperty()
  @Expose()
  features: PlanFeatures;
}
