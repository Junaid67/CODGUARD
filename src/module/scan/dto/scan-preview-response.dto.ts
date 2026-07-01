import { ApiProperty } from '@nestjs/swagger';
import { RtoSignalEnum } from '../../../shared/enums';

export class ScanPreviewItemDto {
  @ApiProperty()
  shopifyOrderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ nullable: true })
  customerName: string | null;

  @ApiProperty({ nullable: true, example: '+92-300-XXX4567' })
  phoneMasked: string | null;

  @ApiProperty({ enum: RtoSignalEnum, isArray: true, description: 'Signals that matched this order' })
  matchedSignals: RtoSignalEnum[];

  @ApiProperty({ nullable: true })
  orderTotal: number | null;

  @ApiProperty({ nullable: true })
  currency: string | null;

  @ApiProperty({ nullable: true })
  createdAt: Date | null;
}

/**
 * Preview of a historical scan — NOT committed. The merchant reviews/deselects
 * before confirming (§10 step 3).
 */
export class ScanPreviewResponseDto {
  @ApiProperty()
  dateRangeDays: number;

  @ApiProperty({ description: 'Total orders scanned in the range' })
  totalOrdersScanned: number;

  @ApiProperty({ description: 'Count of probable RTO orders found' })
  probableRtoCount: number;

  @ApiProperty({ type: [ScanPreviewItemDto] })
  items: ScanPreviewItemDto[];
}
