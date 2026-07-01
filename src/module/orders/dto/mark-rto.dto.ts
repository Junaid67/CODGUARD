import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Optional context when manually marking an order as RTO.
 */
export class MarkRtoDto {
  @ApiPropertyOptional({ description: 'Optional note recorded in the audit trail' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
