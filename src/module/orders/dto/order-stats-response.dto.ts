import { ApiProperty } from '@nestjs/swagger';

/**
 * Dashboard overview metrics (§11). Rates are percentages over orders whose
 * outcome is decided (delivered + RTO); null when nothing is decided yet.
 */
export class OrderStatsResponseDto {
  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  delivered: number;

  @ApiProperty()
  rto: number;

  @ApiProperty()
  highRisk: number;

  @ApiProperty()
  mediumRisk: number;

  @ApiProperty()
  lowRisk: number;

  @ApiProperty()
  unknownRisk: number;

  @ApiProperty({ nullable: true, description: 'delivered / decided × 100' })
  acceptanceRate: number | null;

  @ApiProperty({ nullable: true, description: 'RTO / decided × 100' })
  rejectionRate: number | null;

  @ApiProperty({
    description:
      'Sum of order totals of high-risk-flagged orders that ended in RTO — losses the merchant could have avoided by holding those shipments',
  })
  estimatedRtoLossPrevented: number;
}
