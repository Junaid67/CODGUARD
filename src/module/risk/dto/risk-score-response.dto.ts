import { ApiProperty } from '@nestjs/swagger';
import { RiskLevelEnum } from '../../../shared/enums';

/**
 * Aggregated, cross-store risk for a phone number. Never includes the raw or
 * encrypted phone — only the risk signal and counts. deliveryRate is null for
 * UNKNOWN (no data).
 */
export class RiskScoreResponseDto {
  @ApiProperty({ enum: RiskLevelEnum })
  riskLevel: RiskLevelEnum;

  @ApiProperty({ nullable: true, example: 34.5 })
  deliveryRate: number | null;

  @ApiProperty({ example: 12 })
  totalOrders: number;

  @ApiProperty({ required: false })
  deliveredCount?: number;

  @ApiProperty({ required: false })
  rtoCount?: number;

  @ApiProperty({ required: false, description: 'Distinct stores contributing data' })
  contributingStores?: number;

  @ApiProperty({ required: false, example: 'No data yet' })
  message?: string;
}
