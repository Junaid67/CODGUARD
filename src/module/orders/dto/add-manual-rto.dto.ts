import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Settings → Manual RTO: a phone number the merchant flags as RTO directly,
 * with no real Shopify order behind it.
 */
export class AddManualRtoDto {
  @ApiProperty({ example: '03001234567', description: 'Pakistani phone number (any common format)' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
