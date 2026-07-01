import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Step 5: confirm the scan. Orders the merchant deselected are excluded by
 * their Shopify order id. dateRangeDays must match the previewed range.
 */
export class ConfirmScanDto {
  @ApiProperty({
    type: [String],
    description: 'Shopify order ids to exclude (deselected false positives)',
    example: ['order_123', 'order_456'],
  })
  @IsArray()
  @IsString({ each: true })
  excludedOrderIds: string[] = [];

  @ApiPropertyOptional({ default: 180, minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  dateRangeDays = 180;
}
