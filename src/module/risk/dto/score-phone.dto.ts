import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input for scoring a phone number. The raw value is normalized/hashed inside
 * RiskService — it is never stored or returned as-is.
 */
export class ScorePhoneDto {
  @ApiProperty({ example: '03001234567', description: 'Pakistani phone number (any common format)' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
