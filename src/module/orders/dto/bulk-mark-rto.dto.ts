import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';

/**
 * Bulk mark order records (by their UUID ids) as RTO or delivered.
 */
export class BulkMarkRtoDto {
  @ApiProperty({ type: [String], description: 'Order record UUIDs' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  orderIds: string[];
}
