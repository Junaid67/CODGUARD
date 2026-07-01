import { ApiProperty } from '@nestjs/swagger';
import { OrderOutcomeEnum, RiskLevelEnum } from '../../../shared/enums';

/**
 * Dashboard view of an order. Phone is shown MASKED (last 4 digits only) —
 * never the raw or encrypted value.
 */
export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shopifyOrderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ nullable: true })
  customerName: string | null;

  @ApiProperty({ nullable: true, example: '+92-300-XXX4567' })
  phoneMasked: string | null;

  @ApiProperty({ enum: RiskLevelEnum })
  riskLevel: RiskLevelEnum;

  @ApiProperty({ nullable: true })
  deliveryRateAtOrderTime: number | null;

  @ApiProperty({ enum: OrderOutcomeEnum })
  outcome: OrderOutcomeEnum;

  @ApiProperty({ nullable: true })
  orderTotal: number | null;

  @ApiProperty({ nullable: true })
  currency: string | null;

  @ApiProperty({ nullable: true })
  shopifyFinancialStatus: string | null;

  @ApiProperty({ nullable: true })
  shopifyFulfillmentStatus: string | null;

  @ApiProperty({ nullable: true })
  shopifyCreatedAt: Date | null;
}
